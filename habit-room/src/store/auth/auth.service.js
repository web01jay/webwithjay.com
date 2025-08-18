import axiosInstance from '../../utils/axiosInstance';

const API_URL = `${import.meta.env.VITE_APP_API_URL}/auth`;

export const loginService = ({ email, password }) => async (dispatch) => {
    try {
        const res = await axiosInstance.post(`${API_URL}/login`, { email, password });
        dispatch({ type: 'auth/login', payload: res.data });
        return res.data;
    } catch (error) {
        // Handle error, e.g., dispatch an error action or show a message
        console.error('Login failed:', error);
        dispatch({ type: 'auth/login/failed', payload: error.message });
    }
};

export const signupService = ({ name, email, password }) => async (dispatch) => {
    try {
        const res = await axiosInstance.post(`${API_URL}/signup`, { name, email, password });
        return res.data;
    } catch (error) {
        // Handle error, e.g., dispatch an error action or show a message
        console.error('Signup failed:', error);
    }
};

export default {  };
