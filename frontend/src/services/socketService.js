import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useUIStore } from '../store/uiStore';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = rawApiUrl.replace(/\/+$/, '');

let socket;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to real-time notification server');
    });

    socket.on('order-created', (data) => {
      toast.success(`New order ${data.orderNumber} placed!`);
      // Could also update notifications state here
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });
  }
};

export const getSocket = () => socket;
