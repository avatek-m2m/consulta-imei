document.addEventListener('DOMContentLoaded', () => {
    const imeiInput = document.getElementById('imeiInput');
    const checkButton = document.getElementById('checkButton');
    const resultsDiv = document.getElementById('results');
    const loader = document.getElementById('loader');

    // --- CONFIGURAÇÕES ---
    // 1. Cole a URL do seu App da Web do Google Apps Script aqui
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxI0Re9NmKrgVDgJJw7M80jKQp5dHYCqAFk412k-2cBzNdxG_ldT1w_xTIVriFI3Wdw/exec';

    // 2. Cole sua chave da API do imei.info aqui
    const IMEI_INFO_API_KEY = 'ef20d6c9-1f4f-4fa2-9285-7f4035cd5fe3'; 
    const IMEI_INFO_API_URL = 'https://dash.imei.info/api/v1/device/info';
    // --- FIM DAS CONFIGURAÇÕES ---

    checkButton.addEventListener('click', checkImei);
    imeiInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') checkImei(); });

    async function checkImei() {
        const imei = imeiInput.value.trim();
        if (!/^\d{14,15}$/.test(imei)) {
            displayError('Por favor, insira um IMEI válido (14 ou 15 dígitos).');
            return;
        }

        const tac = imei.substring(0, 8);
        resultsDiv.innerHTML = '';
        loader.classList.remove('hidden');

        try {
            // ETAPA 1: Tenta buscar na base local (Google Sheets)
            const localResponse = await fetch(`${GOOGLE_SCRIPT_URL}?tac=${tac}`);
            const localData = await localResponse.json();

            if (localData.status === 'found') {
                console.log('Dados encontrados na base local!');
                displayResults(localData.data, 'Base de Dados Local');
                return; // Encerra a função aqui, pois já encontrou
            }
            
            // ETAPA 2: Se não encontrou, busca na API externa
            console.log('Não encontrado na base local. Consultando API externa...');
            const externalData = await fetchFromExternalAPI(imei);
            
            displayResults(externalData, 'API Externa (imei.info)');
            
            // ETAPA 3: Salva o novo resultado na base local para futuras consultas
            await saveToSheet(tac, externalData.brand, externalData.model);

        } catch (error) {
            displayError(error.message);
        } finally {
            loader.classList.add('hidden');
        }
    }
    
    async function fetchFromExternalAPI(imei) {
        if (IMEI_INFO_API_KEY === 'SUA_CHAVE_API_AQUI') {
            throw new Error('Erro: A Chave de API (IMEI_INFO_API_KEY) não foi configurada.');
        }

        const requestUrl = `${IMEI_INFO_API_URL}?imei=${imei}&format=json`;
        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: { 'X-Api-Key': IMEI_INFO_API_KEY },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro na API externa: ${response.status}`);
        }
        return await response.json();
    }

    async function saveToSheet(tac, brand, model) {
        console.log(`Salvando TAC ${tac} na base de dados...`);
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Necessário para POST em Apps Script simples
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tac, brand, model }),
            });
            console.log('Salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar na planilha:', error);
        }
    }

    function displayResults(data, source) {
        const deviceName = `${data.brand} ${data.model}`;
        let content = `
            <h2>${deviceName}</h2>
            <p style="font-size: 0.9em; color: #666;"><em>Fonte: ${source}</em></p>
            <ul>
                <li><strong>Marca:</strong> ${data.brand}</li>
                <li><strong>Modelo:</strong> ${data.model}</li>
                <li><strong>TAC (8 dígitos):</strong> ${data.tac || 'N/A'}</li>
            </ul>
        `;
        resultsDiv.innerHTML = content;
    }

    function displayError(message) {
        resultsDiv.innerHTML = `<p class="error">${message}</p>`;
    }
});
