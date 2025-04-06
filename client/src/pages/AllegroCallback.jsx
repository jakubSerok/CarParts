// src/pages/AllegroCallback.jsx
import { useEffect,useContext, useState } from "react";
import { Context } from "../context/ContextProvider";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AllegroCallback = () => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false); // Nowy stan
  const { url } = useContext(Context);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code && !processing) { // Dodany warunek
      setProcessing(true);
      console.log('Przetwarzam kod:', code);
      
      axios.get(`${url}/api/allegro/auth/callback?code=${code}`)
        .then(response => {
          localStorage.setItem('allegro_token', response.data.token);
          navigate('/', { replace: true }); // Replace zapobiega powrotowi
        })
        .catch(error => {
          console.error('Błąd:', error.response?.data);
          navigate('/error', { state: { error: error.response?.data } });
        })
        .finally(() => {
          window.history.replaceState({}, '', window.location.pathname); // Czyścimy URL
        });
    }
  }, [navigate, processing]);

  return <div>Przetwarzanie logowania...</div>;
};
export default AllegroCallback;