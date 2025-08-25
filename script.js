document.addEventListener('DOMContentLoaded', () => {
    const imeiInput = document.getElementById('imeiInput');
    const checkButton = document.getElementById('checkButton');
    const resultsDiv = document.getElementById('results');
    const loader = document.getElementById('loader');

    // IMPORTANTE: Substitua 'SUA_CHAVE_API_AQUI' pela sua chave real do imei.info
    const API_KEY = 'ef20d6c9-1f4f-4fa2-9285-7f4035cd5fe3'; 

    const API_URL = 'https://dash.imei.info/api/v1/device/info';

    checkButton.addEventListener('click', checkImei);

    // Permite que o usuário aperte "Enter" para pesquisar
    imeiInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            checkImei();
        }
    });

    async function checkImei() {
        const imei = imeiInput.value.trim();

        if (API_KEY === 'SUA_CHAVE_API_AQUI') {
            displayError('Erro: A Chave de API (API_KEY) não foi configurada no arquivo script.js.');
            return;
        }

        if (!/^\d{14,15}$/.test(imei)) {
            displayError('Por favor, insira um IMEI válido (14 ou 15 dígitos).');
            return;
        }

        // Prepara a interface para a consulta
        resultsDiv.innerHTML = '';
        loader.classList.remove('hidden');

        const requestUrl = `${API_URL}?imei=${imei}&format=json`;

        try {
            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'X-Api-Key': API_KEY,
                },
            });

            if (!response.ok) {
                // Trata erros da API, como chave inválida ou IMEI não encontrado
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro ${response.status}: Não foi possível consultar o IMEI.`);
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            displayError(error.message);
        } finally {
            // Esconde o loader ao finalizar
            loader.classList.add('hidden');
        }
    }

    function displayResults(data) {
        // Limpa resultados antigos
        resultsDiv.innerHTML = '';

        // Cria a exibição dos dados
        const deviceName = `${data.brand} ${data.model}`;
        const imageUrl = data.device; // A API retorna a URL da imagem no campo 'device'

        let content = `
            <h2>${deviceName}</h2>
            ${imageUrl ? `<img src="${imageUrl}" alt="${deviceName}" style="max-width: 150px; border-radius: 8px; margin-bottom: 1rem;">` : ''}
            <ul>
                <li><strong>Marca:</strong> ${data.brand}</li>
                <li><strong>Modelo:</strong> ${data.model}</li>
                <li><strong>IMEI:</strong> ${data.imei}</li>
            </ul>
        `;
        
        // Adiciona especificações, se existirem
        if (data.specifications && data.specifications.length > 0) {
            content += '<h3>Especificações:</h3><ul>';
            data.specifications.forEach(spec => {
                content += `<li><strong>${spec.name}:</strong> ${spec.value}</li>`;
            });
            content += '</ul>';
        }

        resultsDiv.innerHTML = content;
    }

    function displayError(message) {
        resultsDiv.innerHTML = `<p class="error">${message}</p>`;
    }
});
