import * as functions from 'firebase-functions';
import { emptyCollection } from '../common/collection';
import { getTableById, nextPlayerPlusPlus, COLLECTION_NAME as tableCollectionName } from '../tables';
import { announceIA, shouldStopAnnounces, getBestAnnounce } from './business';

const COLLECTION_NAME = 'announces';

export const getAnnouncesCollection = (tableId) => {
    const table = getTableById(tableId);

    return table.collection(COLLECTION_NAME);
};

function createAnnouncesFromSnapshot(snapshot) {
    const announces = [];

    snapshot.forEach(doc => announces.push(doc.data()));

    return announces;
}

export async function getAnnounces(tableId) {
    const announces = await getAnnouncesCollection(tableId)
        .get()
        .then(createAnnouncesFromSnapshot);

    return announces;
}

export async function performAnnounce(tableId, playerId) {
    await getAnnouncesCollection(tableId).add({
        playerId,
        announce: announceIA(),
    });
}

/**
 * @dataProvider addCardPlayed({playerId: '2GQLBAuwQiPlDAlAMmVT', card: 'AH'})
 * @type {CloudFunction<DeltaDocumentSnapshot>}
 */
exports.onAnnounce = functions.firestore
    // @TODO: fix tableCollectionName=undefined
    .document(`${tableCollectionName || 'tables'}/{tableId}/${COLLECTION_NAME}/{announceId}`)
    .onCreate(async (snap, context) => {
        // @ TODO: tables en dur
        const tableId = context.params.tableId;
        const playerId = snap.data().playerId;

        const announces = await getAnnounces(tableId);
        if (shouldStopAnnounces(announces)) {
            const fbTable = getTableById(tableId);
            const firstPlayerId = await fbTable.get().then(doc => doc.data().firstPlayerId);

            await emptyCollection(getAnnouncesCollection(tableId));

            await fbTable.update(
                {
                    currentPlayerId: firstPlayerId,
                    currentAnnounce: getBestAnnounce(announces),
                    mode: 'play',
                },
                { merge: true },
            );
        } else {
            await nextPlayerPlusPlus(tableId, playerId);
        }
    });
