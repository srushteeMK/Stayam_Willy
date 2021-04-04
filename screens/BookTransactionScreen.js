import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as Permissions from "expo-permissions";
import firebase from "firebase";
import db from "../config.js";

export default class BookTransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedData: "",
      buttonState: "normal",
      scannedBookId: "",
      scannedStudentId: "",
      bookId: "",
      studentId: "",
      transactionMessage: "",
    };
  }

  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false,
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    var buttonState = this.state.buttonState;
    if (buttonState === "BookId") {
      this.setState({
        scanned: true,
        scannedBookId: data,
        buttonState: "normal",
      });
    } else if (buttonState === "StudentId") {
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: "normal",
      });
    }
  };

  checkBookEligibility = async () => {
    const bookRef = await db
      .collection("books")
      .where("bookId", "==", this.state.scannedBookId)
      .get();
    var transactionType = "";
    if (bookRef.docs.length === 0) {
      transactionType = false;
      this.setState({
        scannedStudentId: "",
        scannedBookId: "",
      });
    } else {
      bookRef.docs.map((doc) => {
        var book = doc.data();
        if (book.bookAvailibility) {
          transactionType = "issue";
        } else {
          transactionType = "return";
        }
      });
    }
    return transactionType;
  };

  checkStudentEligibilityForIssue = async () => {
    const studentRef = await db
      .collection("students")
      .where("studentId", "==", this.state.scannedStudentId)
      .get();
    var isStudentEligible;
    if (studentRef.docs.length === 0) {
      isStudentEligible = false;
    } else {
      studentRef.docs.map((doc) => {
        var student = doc.data();
        if (student.numberOfBooksIssued < 2) {
          isStudentEligible = true;
        } else {
          isStudentEligible = false;
          alert("Maximum no. of books exceeded!");
          this.setState({
            scannedStudentId: "",
            scannedBookId: "",
          });
        }
      });
    }
    return isStudentEligible;
  };

  checkStudentEligibilityForReturn = async () => {
    const studentRef = await db
      .collection("transactions")
      .where("bookId", "==", this.state.scannedBookId)
      .limit()
      .get();
    var isStudentEligible;
    studentRef.docs.map((doc)=>{
      var lastTransaction = doc.data();
      if(lastTransaction.studentId === this.state.scannedStudentId){
        isStudentEligible = true;
      }else {
        isStudentEligible = false;
        alert("Book was not issued to specified student");
        this.setState({
          scannedBookId: '',
          scannedStudentId: '',
        })
      }
    })
    return isStudentEligible;
  };

  handleTransaction = async () => {
    var transactionType = await this.checkBookEligibility();
    if (!transactionType) {
      alert("Book does not exist!");
      this.setState({
        scannedStudentId: "",
        scannedBookId: "",
      });
    } else if (transactionType === "issue") {
      var isStudentEligible = await this.checkStudentEligibilityForIssue();
      if (isStudentEligible) {
        this.initiateBookIssue();
        alert("Book Issued");
      }
    } else {
      var isStudentEligible = await this.checkStudentEligibilityForReturn();
      if (isStudentEligible) {
        this.initiateBookReturn();
        alert("Book Returned");
      }
    }
  };

  initiateBookIssue = async () => {
    db.collection("transactions").add({
      studentId: this.state.scannedStudentId,
      bookId: this.state.scannedBookId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: "Issue",
    });
    db.collection("books").doc(this.state.scannedBookId).update({
      bookAvailibility: false,
    });
    db.collection("students")
      .doc(this.state.scannedStudentId)
      .update({
        numberOfBooksIssued: firebase.firestore.FieldValue.increment(1),
      });
  };

  initiateBookReturn = async () => {
    db.collection("transactions").add({
      studentId: this.state.scannedStudentId,
      bookId: this.state.scannedBookId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: "Return",
    });
    db.collection("books").doc(this.state.scannedBookId).update({
      bookAvailibility: true,
    });
    db.collection("students")
      .doc(this.state.scannedStudentId)
      .update({
        numberOfBooksIssued: firebase.firestore.FieldValue.increment(-1),
      });
  };

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;
    if (buttonState !== "normal" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    } else if (buttonState === "normal") {
      return (
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.container}
          enabled
        >
          <View>
            <Image
              source={require("../assets/booklogo.jpg")}
              style={{ width: 200, height: 200 }}
            />
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder=" Book ID"
              onChangeText={(text) => {
                this.setState({
                  scannedBookId: text,
                });
              }}
              value={this.state.scannedBookId}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions("BookId");
              }}
            >
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder=" Student  ID"
              onChangeText={(text) => {
                this.setState({
                  scannedStudentId: text,
                });
              }}
              value={this.state.scannedStudentId}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions("StudentId");
              }}
            >
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={async () => {
              console.log(this.state.scannedBookId);
              var transactionMessage = this.handleTransaction();
              // this.setState({
              //   scannedBookId: this.state.bookId,
              //   scannedStudentId: this.state.studentId,
              //   bookId: '',
              //   studentId: ''
              // })
            }}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: "underline",
  },
  scanButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    margin: 10,
  },
  buttonText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
  },
  inputView: {
    flexDirection: "row",
    margin: 20,
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20,
  },
  scanButton: {
    backgroundColor: "#66BB6A",
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0,
  },
  submitButton: {
    backgroundColor: "#FBC02D",
    width: 100,
    height: 50,
  },
  submitButtonText: {
    padding: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
});
