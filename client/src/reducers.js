import { combineReducers } from 'redux';

import { reducer as playerReducer } from './player/duck';
import { reducer as bootstrapReducer } from './bootstrap/duck';
import { reducer as tableReducer } from './table/ducks';
import { chatReducer } from './chat/ducks';

export default combineReducers({
    bootstrap: bootstrapReducer,
    player: playerReducer,
    table: tableReducer,
    chat: chatReducer,
});
