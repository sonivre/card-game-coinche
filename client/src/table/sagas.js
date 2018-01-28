import { call, select, put, take } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import db from '../api/init';
import { createFakePlayers } from '../player/sagas';
import { getPlayerId } from '../player/selectors';
import { setTableId, dealCardsToPlayer } from '../table/ducks';
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

export function* createTableAndAddPlayerToTable() {
    const playersId = yield call(createFakePlayers);
    // Add current player Id to other ID
    playersId.push(yield select(getPlayerId));

    const players = playersId.map(playerId => ({
        id: playerId,
    }));

    const document = yield db.collection(COLLECTION_NAME).add({
        players,
        trick: [],
    });

    yield put(setTableId(document.id));
}

/**
 * Hold action on snapshot event trigger
 * @param payload
 */
function* incomingSnapshotData(payload) {
    const player = filterPlayer(yield select(getPlayerId), payload);
    if (player.cards) {
        yield put(dealCardsToPlayer(player.cards));
    }
}

// this function creates an event channel from a given document
// Setup subscription to incoming `snapshot` events
/**
 * @doc https://github.com/redux-saga/redux-saga/blob/master/docs/advanced/Channels.md#using-the-eventchannel-factory-to-connect-to-external-events
 * @param document
 * @return DocumentSnapshot
 */
function createSnapshotChannel(document) {
    // `eventChannel` takes a subscriber function
    // the subscriber function takes an `emit` argument to put messages onto the channel
    return eventChannel((emit) => {
        const snapshotHandler = (snap) => {
            // puts event payload into the channel
            // this allows a Saga to take this payload from the returned channel
            emit(snap);
        };

        // setup the subscription
        document.onSnapshot(snapshotHandler);

        // the subscriber must return an unsubscribe function
        // this will be invoked when the saga calls `channel.close` method
        return () => {};
    });
}

export function* watchOnSnapshot() {
    const document = yield call(getTable, yield select(getTableId));
    const snapshotChannel = yield call(createSnapshotChannel, document);

    while (true) {
        const snapshot = yield take(snapshotChannel);
        yield call(incomingSnapshotData, snapshot.data());
    }
}
