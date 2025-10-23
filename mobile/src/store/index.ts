import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import reservationsReducer from './slices/reservationsSlice';
import invoicesReducer from './slices/invoicesSlice';
import messagesReducer from './slices/messagesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reservations: reservationsReducer,
    invoices: invoicesReducer,
    messages: messagesReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
