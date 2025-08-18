import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/auth.slice';
// import blogReducer from '../features/blog/blogSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // blog: blogReducer,
  },
});
