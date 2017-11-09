import React, { Component } from 'react'
import { connect } from 'react-redux'
import Board from './board/board.view';
import UserConnect from './users/connect.container'

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onClick: () => {
      dispatch({ type: 'TEST_ACTION', payload: {}})
    }
  }
}

class App extends Component {
  render() {
    return (
      <Board>
        <button onClick={this.props.onClick}>CLICK ME DUDE!</button>
        <UserConnect />
      </Board>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps,
)(App);
