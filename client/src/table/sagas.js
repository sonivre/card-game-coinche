import { call, select, put, take } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import db from '../api/init';
import { createFakePlayers } from '../player/sagas';
import { getPlayerId } from '../player/selectors';
import { setTableId, updatePlayerCard, updateTrick, updateTableDocument } from './ducks';
import { getTableId } from '../table/selectors';
import { filterPlayer } from './helpers';

const COLLECTION_NAME = 'tables';

/**
 * Return a "table" document
 * @param tableId
 * @returns {*}
 */
export function* getTable(tableId) {
    return yield db.collection(COLLECTION_NAME).doc(tableId);
}

// this function creates an event channel from a given document
// Setup subscription to incoming `snapshot` events
/**
 * @doc https://github.com/redux-saga/redux-saga/blob/master/docs/advanced/Channels.md#using-the-eventchannel-factory-to-connect-to-external-events
 * @param document
 * @return DocumentSnapshot
 */

/**
 * Hold action on snapshot event trigger
 * @param payload
 */
function* updateDocumentTableHandler(payload) {
    // update player hand
    const playerId = yield select(getPlayerId);
    const player = payload.players.find(filterPlayer(playerId));
    if (player.cards) {
        yield put(updatePlayerCard(player.cards));
    }

    // update tricks
    yield put(updateTrick(payload.trick));

    // update table
    yield put(updateTableDocument(payload));
}

function createSnapshotChannel(document) {
    // `eventChannel` takes a subscriber function
    // the subscriber function takes an `emit` argument to put messages onto the channel
    return eventChannel((emit) => {
        // setup the subscription
        document.onSnapshot(emit);

        // the subscriber must return an unsubscribe function
        // this will be invoked when the saga calls `channel.close` method
        return () => {};
    });
}

export function* watchUpdateOnDocumentTable() {
    const tableId = yield select(getTableId);
    const document = yield call(getTable, tableId);
    const snapshotChannel = yield call(createSnapshotChannel, document);

    while (true) {
        const snapshot = yield take(snapshotChannel);
        yield call(updateDocumentTableHandler, snapshot.data());
    }
}

export function* createTableAndAddPlayerToTable() {
    const players = [];
    const meId = yield select(getPlayerId);
    // Add current player Id to other ID
    players.push({
        id: meId,
        isFakePlayer: false,
        pos: 0,
    });
    // Create fake player
    const fakePlayers = yield call(createFakePlayers);

    // for each player, add a position and add them into the list
    fakePlayers.forEach((player, pos) => players.push({
        ...player,
        pos: pos + 1,
    }));

    console.log('players ', players);

    const document = yield db.collection(COLLECTION_NAME).add({
        players,
        trick: [],
    });

    yield put(setTableId(document.id));
    yield call(watchUpdateOnDocumentTable);
}
