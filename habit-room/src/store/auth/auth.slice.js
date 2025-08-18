import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from './auth.service';

const initialState = {
  user: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk('auth/login', AuthService.login);
export const signup = createAsyncThunk('auth/signup', AuthService.signup);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, signup.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(login.rejected, signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
