import { IAnnounce } from "./model";

export function announceIA() {
    return 'pass';
}

export function shouldStopAnnounces(announces: IAnnounce[]) {
    return announces.length === 4;
}

export function getBestAnnounce(announces: IAnnounce[]) {
    const announcesWoPass = announces.filter((a: any) => a.announce !== 'pass');
    // @TODO: case 4 pass;

    return announcesWoPass[announcesWoPass.length - 1];
}
