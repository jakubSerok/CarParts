import { useState, useEffect } from 'react';
import axios from 'axios';

const AddProduct = () => {
  const [frazaWyszukiwania, setFrazaWyszukiwania] = useState('');
  const [wynikiWyszukiwania, setWynikiWyszukiwania] = useState([]);
  const [ladowanie, setLadowanie] = useState(false);
  const [blad, setBlad] = useState(null);
  const [wybranyProdukt, setWybranyProdukt] = useState(null);
  const [edycja, setEdycja] = useState(false);
  const [productObject, setProductObject] = useState(null);
  const [selectedParams, setSelectedParams] = useState([]); // indexes of selected parameters
  const [productDetails, setProductDetails] = useState({
    name: '',
    category: { id: '' },
    parameters: [],
    sellingMode: {
      format: 'BUY_NOW',
      price: { amount: '', currency: 'PLN' }
    },
    stock: { available: 1 },
    description: { sections: [] },
    images: [],
    delivery: { shippingRates: { id: '' } }
  });
  const [statusWysylki, setStatusWysylki] = useState(null);
  const [edytujOpis, setEdytujOpis] = useState(false);

  // Funkcja do wyświetlania pełnej struktury produktu w konsoli
  const debugujProdukt = (produkt) => {
    console.log('Pełna struktura produktu:', JSON.parse(JSON.stringify(produkt)));
    return produkt;
  };

  const parseDescription = (description) => {
    if (!description || !description.sections) return '';
    return description.sections
      .map(section => 
        section.items
          .filter(item => item.type === 'TEXT')
          .map(item => item.content)
          .join('')
      )
      .join('');
  };

  const szukajProduktow = async (e) => {
    e.preventDefault();
    if (!frazaWyszukiwania.trim()) return;

    setLadowanie(true);
    setBlad(null);
    setWynikiWyszukiwania([]);

    try {
      const odpowiedz = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/allegro/search`, {
        params: { phrase: frazaWyszukiwania },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('allegro_token')}`
      }
      });
      
      if (odpowiedz.data?.products) {
        if (odpowiedz.data.products.length > 0) {
          debugujProdukt(odpowiedz.data.products[0]);
        }
        setWynikiWyszukiwania(odpowiedz.data.products);
      } else {
        setBlad('Nie znaleziono produktów lub nieprawidłowa struktura odpowiedzi');
      }
    } catch (err) {
      setBlad(`Błąd podczas wyszukiwania produktów: ${err.message}`);
      console.error('Błąd wyszukiwania:', err.response?.data || err.message);
    } finally {
      setLadowanie(false);
    }
  };

  const wyczyscWyszukiwanie = () => {
    setFrazaWyszukiwania('');
    setWynikiWyszukiwania([]);
    setBlad(null);
  };

  const wybierzProdukt = async (produkt) => {
    try {

      
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/allegro/product-offers/${produkt.id}`,{headers: {
        'Authorization': `Bearer ${localStorage.getItem('allegro_token')}`
    }});
    setProductObject(response.data);
          const offerDetails = response.data;
      console.log(offerDetails);
      setWybranyProdukt(offerDetails);
      setProductDetails({
        name: offerDetails.name || '',
        productId: offerDetails.id,
        category: offerDetails.category
          ? { ...offerDetails.category }
          : { id: '' },
        parameters: offerDetails.parameters || [],
        sellingMode: {
          format: 'BUY_NOW',
          price: { amount: offerDetails.sellingMode?.price?.amount || '', currency: 'PLN' }
        },
        stock: { available: offerDetails.stock?.available || 1 },
        description: offerDetails.description || { sections: [] },
        images: offerDetails.images || [],
        delivery: { shippingRates: { id: offerDetails.delivery?.shippingRates?.id || '' } }
      });
      // Default: select all parameters
      setSelectedParams(offerDetails.parameters ? offerDetails.parameters.map((_, i) => i) : []);
      // Set editable description from Allegro if available
      const origDesc = (() => {
        if (!offerDetails.description || !offerDetails.description.sections) return '';
        return offerDetails.description.sections
          .map(section =>
            section.items
              .filter(item => item.type === 'TEXT')
              .map(item => item.content)
              .join('')
          )
          .join('');
      })();
      setProductDetails(prev => ({
        ...prev,
        description: { sections: [{ items: [{ type: 'TEXT', content: origDesc }] }] }
      }));
      setFrazaWyszukiwania('');
      setEdycja(true);
      setWynikiWyszukiwania([]);
    } catch (error) {
      setBlad(`Błąd podczas pobierania oferty: ${error.message}`);
      console.error('Błąd pobierania oferty:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const path = name.split('.');
    setProductDetails(prev => {
      const newState = { ...prev };
      let current = newState;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newState;
    });
  };

  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      setBlad('Obraz jest zbyt duży (max 5MB)');
      return;
    }
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const noweZdjecia = [...productDetails.images];
        noweZdjecia[index].file = file;
        noweZdjecia[index].url = e.target.result;
        setProductDetails(prev => ({
          ...prev,
          images: noweZdjecia
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const zmienZdjecie = (e, index) => {
    if (e.target.files) {
      handleImageUpload(e, index);
    } else {
      const noweZdjecia = [...productDetails.images];
      noweZdjecia[index].url = e.target.value;
      setProductDetails(prev => ({
        ...prev,
        images: noweZdjecia
      }));
    }
  };

  const dodajZdjecie = () => {
    setProductDetails(prev => ({
      ...prev,
      images: [...prev.images, { url: '' }]
    }));
  };

  const usunZdjecie = (index) => {
    const noweZdjecia = productDetails.images.filter((_, i) => i !== index);
    setProductDetails(prev => ({
      ...prev,
      images: noweZdjecia
    }));
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload({ target: { files: [file] } }, index);
  };

  const anulujEdycje = () => {
    setEdycja(false);
    setWybranyProdukt(null);
    setStatusWysylki(null);
  };

  const wystawProdukt = async () => {
    if (!productDetails.name || !productDetails.stock.available) {
      setBlad('Nazwa i ilość są wymagane');
      return;
    }
    if (!productDetails.sellingMode.price.amount || isNaN(productDetails.sellingMode.price.amount)) {
      setBlad('Proszę podać poprawną cenę produktu');
      return;
    }
    setLadowanie(true);
    setBlad(null);

    try {
      // Przygotuj opis z wybranymi parametrami na początku
      const params = productDetails.parameters || [];
      // Użyj tylko wybranych parametrów
      const selected = selectedParams.length ? selectedParams : params.map((_, i) => i);
      const paramsToShow = selected.map(i => params[i]).filter(Boolean);
      // Funkcja czyszcząca HTML z <br/>
const cleanHtml = (html) => html.replace(/<br\s*\/?\>/gi, '');
const paramsHtml = paramsToShow.map(p => `<p><b>${p.name || p.parameterName || ''}: </b>${(Array.isArray(p.values) ? p.values.join(', ') : p.value || '')}</p>`).join('');
      // Użyj customDesc jeśli jest, w przeciwnym razie domyślny opis
      const origDesc = parseDescription(productDetails.description);
      // Połącz parametry i opis i wyczyść z <br/>
      const finalDescHtml = cleanHtml(paramsHtml + (origDesc ? `<p></p>${origDesc}` : ''));
      // Budujemy strukturę opisu wymaganą przez Allegro (TEXT + IMAGE)
      const textSection = {
        items: [
          {
            type: 'TEXT',
            content: finalDescHtml
          }
        ]
      };
      const imageSection = {
        items: productDetails.images
          .filter(img => img.url)
          .map(img => ({ type: 'IMAGE', url: img.url }))
      };
      // Dodaj sekcję obrazów tylko jeśli są obrazy
      const sections = [textSection];
      if (imageSection.items.length > 0) sections.push(imageSection);
      const allegroDescription = { sections };

      // Zbuduj strukturę jakiej oczekuje backend/Allegro
      const updatedProduct = {
        ...productObject, // Oryginalne dane z Allegro
        name: productDetails.name,
        category: productDetails.category,
        product: { id: productDetails.productId },

        parameters: productDetails.parameters,
        sellingMode: {
          format: 'BUY_NOW',
          price: {
            amount: productDetails.sellingMode.price.amount.toString(),
            currency: 'PLN'
          }
        },
        stock: { 
          available: parseInt(productDetails.stock.available) || 1,
          unit: "UNIT"
        },
        description: allegroDescription,
        // Convert image objects to simple string URLs as required by Allegro API
        images: productDetails.images.map(img => img.url),
        delivery: {
          shippingRates: {
            id: '144979ca-6bac-4f06-9842-1b3e181cf6e4' // Stałe ID
          },
          handlingTime: "PT24H"
          
        },
        location: {
          city: "Złotoryja",
          countryCode: "PL",
          postCode: "59-500",
          province: "DOLNOSLASKIE"
        },
        afterSalesServices: {
         
          returnPolicy: { id: "396f4cea-bc91-4979-acdf-a2c391227f14" },
         
        },
        publication: {
          duration: "P30D",
          startingAt: new Date().toISOString(),
          status: 'INACTIVE',
          republish: false
        }
      };
  
      console.log('Wysyłanie produktu:', updatedProduct);
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/allegro/product-offers`, 
        updatedProduct,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('allegro_token')}`
          }
        }
      );
      
      console.log('Odpowiedź serwera:', response);
      setStatusWysylki({
        sukces: true,
        wiadomosc: 'Produkt został pomyślnie wystawiony!'
      });
    } catch (err) {
      setStatusWysylki({
        sukces: false,
        wiadomosc: `Błąd podczas wystawiania produktu: ${err.response?.data?.error || err.message}`
      });
      console.error('Błąd wysyłania:', err);
    } finally {
      setLadowanie(false);
    }
  };

  const wyswietlKategorie = (kategoria) => {
    if (!kategoria) return 'Brak kategorii';
    
    if (Array.isArray(kategoria.path) && kategoria.path.every(item => typeof item === 'string')) {
      return kategoria.path.join(' > ');
    }
    
    if (Array.isArray(kategoria.path) && kategoria.path.every(item => item && item.name)) {
      return kategoria.path.map(c => c.name).join(' > ');
    }
    
    if (kategoria.name) {
      return kategoria.name;
    }
    
    console.warn('Nieznana struktura kategorii:', kategoria);
    return 'Kategoria dostępna (sprawdź konsolę)';
  };



  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dodaj nowy produkt</h2>

   

      {/* Formularz wyszukiwania - pokazuje się tylko gdy nie edytujemy */}
      {!edycja && (
        <form onSubmit={szukajProduktow} className="mb-6">
          <div className="relative flex items-center">
            <input
              type="text"
              value={frazaWyszukiwania}
              onChange={(e) => setFrazaWyszukiwania(e.target.value)}
              placeholder="Wyszukaj produkty..."
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            {frazaWyszukiwania && (
              <button
                type="button"
                onClick={wyczyscWyszukiwanie}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!frazaWyszukiwania || ladowanie}
            className={`mt-3 w-full py-2 px-4 rounded-lg font-medium ${
              !frazaWyszukiwania || ladowanie
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } transition`}
          >
            {ladowanie ? 'Wyszukiwanie...' : 'Szukaj produktów'}
          </button>
        </form>
      )}

      {/* Wyświetlanie błędów */}
      {blad && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{blad}</p>
        </div>
      )}

      {/* Wybór parametrów do opisu */}
      {edycja && productDetails.parameters && productDetails.parameters.length > 0 && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium mb-2">Zaznacz parametry do opisu:</h3>
          <div className="flex flex-wrap gap-3">
            {productDetails.parameters.map((param, idx) => (
              <label key={idx} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedParams.includes(idx)}
                  onChange={() => {
                    setSelectedParams(prev => prev.includes(idx)
                      ? prev.filter(i => i !== idx)
                      : [...prev, idx]);
                  }}
                />
                <span>{param.name || param.parameterName}</span>
              </label>
            ))}
          </div>
          {/* Edytowalny opis produktu z parametrami jako blok nieedytowalny (prepended) */}
          <div className="mt-6">
            <h4 className="font-medium mb-1">Edytuj opis produktu:</h4>
            {(() => {
              const params = productDetails.parameters || [];
              const selected = selectedParams.length ? selectedParams : params.map((_, i) => i);
              const paramsToShow = selected.map(i => params[i]).filter(Boolean);
              const cleanHtml = (html) => html.replace(/<br\s*\/?\>/gi, '');
              const paramsHtmlBlocks = paramsToShow.map(p => `<p><b>${p.name || p.parameterName}: </b>${(Array.isArray(p.values) ? p.values.join(', ') : p.value || '')}</p>`).join('');
              let userDesc = '';
              const fullDesc = productDetails.description?.sections?.[0]?.items?.[0]?.content || '';
              if (paramsHtmlBlocks && fullDesc.startsWith(paramsHtmlBlocks)) {
                userDesc = fullDesc.slice(paramsHtmlBlocks.length);
              } else {
                userDesc = fullDesc;
              }
              const value = paramsHtmlBlocks + userDesc;
              return (
                <textarea
                  name="description"
                  value={value}
                  onChange={e => {
                    let newValue = e.target.value;
                    if (paramsHtmlBlocks && newValue.startsWith(paramsHtmlBlocks)) {
                      newValue = newValue.slice(paramsHtmlBlocks.length);
                    }
                    setProductDetails(prev => ({
                      ...prev,
                      description: { sections: [{ items: [{ type: 'TEXT', content: paramsHtmlBlocks + newValue }] }] }
                    }));
                  }}
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              );
            })()}
          </div>
        </div>
      )}
      {/* Wyniki wyszukiwania */}
      {!edycja && wynikiWyszukiwania.length > 0 && (
        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <h3 className="bg-gray-100 px-4 py-2 font-medium text-gray-700">Znalezione produkty</h3>
          <ul className="divide-y divide-gray-200">
            {wynikiWyszukiwania.map((produkt) => (
              <li key={produkt.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                <div 
                  className="flex items-center justify-between"
                  onClick={() => wybierzProdukt(produkt)}
                >
                  <div className="flex items-center space-x-4">
                    <img 
                      src={produkt.images?.[0]?.url || 'https://via.placeholder.com/50'} 
                      alt={produkt.name}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
                    />
                    <div>
                      <h4 className="font-medium text-gray-800">{produkt.name}</h4>
                      <p className="text-sm text-gray-500">
                        {wyswietlKategorie(produkt.category)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-blue-600">
                    {produkt.price?.amount ? `${produkt.price.amount} zł` : 'Brak ceny'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Panel edycji produktu */}
      {edycja && (
        <div className="mb-6 p-6 border border-blue-200 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-4 text-lg">Edytuj produkt przed wystawieniem</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa produktu</label>
              <input
                type="text"
                name="name"
                value={productDetails.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
              <input
                type="text"
                name="category.id"
                value={productDetails.category.id}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Wprowadź ID kategorii"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cena</label>
              <input
                type="number"
                name="sellingMode.price.amount"
                value={productDetails.sellingMode.price.amount}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Wprowadź cenę"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ilość sztuk</label>
              <input
                type="number"
                name="stock.available"
                value={productDetails.stock.available}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Opis produktu</label>
                <button
                  type="button"
                  onClick={() => setEdytujOpis(!edytujOpis)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {edytujOpis ? 'Zobacz podgląd' : 'Edytuj opis'}
                </button>
              </div>
              {(() => {
  // Get last two parameters
  const params = productDetails.parameters || [];
  const lastTwo = params.slice(-2);
    // <p> tags for both textarea and preview
  const paramsHtmlBlocks = lastTwo.map(p => `<p><b>${p.name || p.parameterName || ''}</b><br/>${(Array.isArray(p.values) ? p.values.join(', ') : p.value || '')}</p>`).join('');
  // For textarea: prepend as HTML string (so user sees <p>...)</p>
  if (edytujOpis) {
    const orig = parseDescription(productDetails.description);
    const value = paramsHtmlBlocks + (orig ? orig : '');
    return (
      <textarea
        name="description"
        value={value}
        onChange={e => {
          // Remove the prepended params before saving back (HTML block)
          let newValue = e.target.value;
          if (paramsHtmlBlocks && newValue.startsWith(paramsHtmlBlocks)) {
            newValue = newValue.slice(paramsHtmlBlocks.length);
          }
          setProductDetails(prev => ({ ...prev, description: { sections: [{ items: [{ type: 'TEXT', content: newValue }] }] } }));
        }}
        rows="8"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    );
  } else {
    // For preview: prepend to html
    const orig = parseDescription(productDetails.description);
    const html = paramsHtmlBlocks + (orig ? orig : '');
    return (
      <div
        className="prose max-w-none p-4 border border-gray-300 rounded-md"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
})()}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zdjęcia produktu</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {productDetails.images.map((zdjecie, index) => (
                  <div
                    key={index}
                    className="relative group border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors"
                    onDrop={(e) => handleDrop(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => zmienZdjecie(e, index)}
                      className="hidden"
                      id={`file-input-${index}`}
                    />
                    <label
                      htmlFor={`file-input-${index}`}
                      className="cursor-pointer block w-full h-full"
                    >
                      {zdjecie.url ? (
                        <img
                          src={zdjecie.url}
                          alt={`Preview ${index}`}
                          className="w-full h-48 object-cover rounded-md"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-center">Przeciągnij i upuść zdjęcie<br/>lub kliknij aby wybrać</p>
                        </div>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => usunZdjecie(index)}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <div
                  className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={dodajZdjecie}
                >
                  <div className="text-center text-gray-400">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-sm mt-2">Dodaj kolejne zdjęcie</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status po wysłaniu */}
          {statusWysylki && (
            <div className={`mt-4 p-3 rounded-md ${
              statusWysylki.sukces 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {statusWysylki.wiadomosc}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={anulujEdycje}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              onClick={wystawProdukt}
              disabled={ladowanie}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                ladowanie ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {ladowanie ? 'Wysyłanie...' : 'Wystaw produkt'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;