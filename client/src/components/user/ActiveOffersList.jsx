import { useState, useEffect } from 'react';
import axios from 'axios';

const ActiveOffersList = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', price: '' });
  const [saving, setSaving] = useState(false);

  const fetchActiveOffers = async () => {
    try {
      const allegroToken = localStorage.getItem('allegro_token');
      if (!allegroToken) {
        setError('Brak tokenu Allegro. Połącz konto z Allegro.');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/allegro/offers/active`,
        {
          headers: {
            'Authorization': `Bearer ${allegroToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setOffers(response.data.offers || []);
    } catch (err) {
      if (err.response?.status === 401 || 
          err.response?.data?.message?.includes('token') || 
          err.message?.includes('token')) {
        setError('Token Allegro wygasł. Połącz ponownie konto z Allegro.');
      } else {
        setError(`Błąd podczas pobierania ofert: ${err.response?.data?.message || err.message}`);
      }
      console.error('Błąd pobierania ofert:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOffers();
  }, []);

  const formatPrice = (price) => {
    return `${parseFloat(price.amount).toFixed(2)} ${price.currency}`;
  };

  const startEditing = (offer) => {
    setEditingId(offer.id);
    setEditData({
      name: offer.name,
      price: offer.sellingMode.price.amount
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({ name: '', price: '' });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveChanges = async (offerId) => {
    if (!editData.name || !editData.price) {
      setError('Nazwa i cena są wymagane');
      return;
    }
  
    setSaving(true);
    try {
      await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/allegro/offers/${offerId}`,
        {
          name: editData.name,
          price: {
            amount: parseFloat(editData.price).toFixed(2),
            currency: 'PLN'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('allegro_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Aktualizacja lokalnej listy ofert
      setOffers(prev => prev.map(offer => 
        offer.id === offerId 
          ? { 
              ...offer, 
              name: editData.name,
              sellingMode: {
                ...offer.sellingMode,
                price: {
                  amount: editData.price,
                  currency: 'PLN'
                }
              }
            }
          : offer
      ));

      setEditingId(null);
    } catch (err) {
      setError(`Błąd podczas zapisywania zmian: ${err.response?.data?.message || err.message}`);
      console.error('Błąd zapisywania:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Aktywne oferty</h2>
        <button 
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchActiveOffers();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Odświeżanie...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>Odśwież</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
          <div className="mt-2 flex space-x-3">
            {(error.includes('Token') || error.includes('token')) && (
              <a 
                href={`${process.env.REACT_APP_BACKEND_URL}/api/allegro/auth`}
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Połącz z Allegro
              </a>
            )}
            <button 
              onClick={() => setError(null)} 
              className="text-sm text-red-600 hover:text-red-800"
            >
              Zamknij
            </button>
          </div>
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Brak aktywnych ofert
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-100 px-4 py-2 font-medium text-gray-700">
            <div className="col-span-5">Nazwa oferty</div>
            <div className="col-span-2 text-center">Cena</div>
            <div className="col-span-2 text-center">Dostępność</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1 text-center">Akcje</div>
          </div>
          <ul className="divide-y divide-gray-200">
            {offers.map((offer) => (
              <li key={offer.id} className="hover:bg-gray-50">
                {editingId === offer.id ? (
                  <div className="grid grid-cols-12 px-4 py-3 items-center gap-2">
                    <div className="col-span-5">
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        name="price"
                        value={editData.price}
                        onChange={handleEditChange}
                        step="0.01"
                        min="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </div>
                    <div className="col-span-2 text-center">
                      {offer.stock.available} {offer.stock.unit === 'UNIT' ? 'szt.' : offer.stock.unit}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        offer.publication.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {offer.publication.status === 'ACTIVE' ? 'Aktywna' : 'Nieaktywna'}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-center space-x-1">
                      <button
                        onClick={() => saveChanges(offer.id)}
                        disabled={saving}
                        className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                        title="Zapisz"
                      >
                        {saving ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Anuluj"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 px-4 py-3 items-center">
                    <div className="col-span-5 flex items-center space-x-3">
                      {offer.primaryImage && (
                        <img 
                          src={offer.primaryImage.url} 
                          alt={offer.name}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
                        />
                      )}
                      <span className="font-medium text-gray-800 truncate">{offer.name}</span>
                    </div>
                    <div className="col-span-2 text-center font-semibold text-blue-600">
                      {formatPrice(offer.sellingMode.price)}
                    </div>
                    <div className="col-span-2 text-center">
                      {offer.stock.available} {offer.stock.unit === 'UNIT' ? 'szt.' : offer.stock.unit}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        offer.publication.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {offer.publication.status === 'ACTIVE' ? 'Aktywna' : 'Nieaktywna'}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        onClick={() => startEditing(offer)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Edytuj"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActiveOffersList;