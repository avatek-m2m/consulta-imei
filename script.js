document.addEventListener('DOMContentLoaded', () => {
    const imeiInput = document.getElementById('imeiInput');
    const checkButton = document.getElementById('checkButton');
    const resultsDiv = document.getElementById('results');
    const loader = document.getElementById('loader');

    // Cole a URL da sua implantação do Google Apps Script aqui
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXq7gGSP7mqPuRLz83KI2Bezr00_3LakbMq9tETP6AUX_-lp-_MqrdWqyzB5gB-TpZ/exec';

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
            // ETAPA 1: Tenta buscar na base local via Google Script
            const localUrl = `${GOOGLE_SCRIPT_URL}?action=lookupLocal&tac=${tac}`;
            let response = await fetch(localUrl);
            let result = await response.json();

            if (result.status === 'found') {
                displayResults(result.data, result.source);
                return; // Encerra, pois já encontrou na base local
            }
            
            // ETAPA 2: Se não encontrou, pede ao Google Script para buscar na API externa
            console.log('Não encontrado na base local. Solicitando busca externa ao proxy...');
            const externalUrl = `${GOOGLE_SCRIPT_URL}?action=lookupExternal&imei=${imei}`;
            response = await fetch(externalUrl);
            result = await response.json();

            if (result.status === 'found') {
                displayResults(result.data, result.source);
            } else {
                // Se o proxy retornar um erro, exibe a mensagem de erro
                displayError(result.message);
            }

        } catch (error) {
            displayError('Ocorreu um erro de comunicação. Verifique sua conexão.');
        } finally {
            loader.classList.add('hidden');
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
            </ul>
        `;
        resultsDiv.innerHTML = content;
    }

    function displayError(message) {
        resultsDiv.innerHTML = `<p class="error">${message || 'Não foi possível encontrar informações para este IMEI.'}</p>`;
    }
});
