import React from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import firebase from "firebase";
import db from "../config.js";
import { ListItem } from "react-native-elements";

export default class SearchScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      allTransactions: [],
    };
  }
  componentDidMount = async () => {
    const query = await db.collection("transactions").get();
    query.docs.map((doc) => {
      this.setState({
        allTransactions: [...this.state.allTransactions, doc.data()],
      });
    });
  };
  render() {
    return (
      <FlatList
        data={this.state.allTransactions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={{ borderBottomWidth: 2 }}>
            <Text>{"Book Id: " + item.bookId}</Text>
            <Text>{"Student id: " + item.studentId}</Text>
            <Text>{"Transaction Type: " + item.transactionType}</Text>
            <Text>{"Date: " + item.date.toDate()}</Text>
          </View>
        )}
        // aboveRenderItem
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
