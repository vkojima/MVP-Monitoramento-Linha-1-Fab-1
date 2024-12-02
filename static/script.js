// script.js
function loadCameraData() {
    fetch('/camera_data')
        .then(response => response.json())
        .then(postos => {
            console.log('Dados recebidos:', postos);
            const additionalInfo = document.getElementById('additional-info');
            additionalInfo.innerHTML = '';

            postos.forEach(posto => {
                const infoBox = document.createElement('div');
                infoBox.className = 'info-box';

                infoBox.innerHTML = `
                <header>
                    <h2>Posto ${posto.id}</h2>
                    <div class="status">${posto.status}</div>
                </header>
                <img src="/video_feed/${posto.id}" alt="Câmera ao Vivo">
                <div class="gauges">
                    <div class="gauge"><canvas id="posto${posto.id}-oee"></canvas></div>
                    <div class="gauge"><canvas id="posto${posto.id}-id"></canvas></div>
                    <div class="gauge"><canvas id="posto${posto.id}-ie"></canvas></div>
                    <div class="gauge"><canvas id="posto${posto.id}-iq"></canvas></div>
                </div>
                <p>Tempo padrão médio: <em>${posto.tempo_padrao_medio} min</em></p>
                <p>Tempo real médio: <em>${posto.tempo_real_medio || 0} min</em></p>
                <p>Qtd. produzidas: <em>${posto.qt_produzida || 0}</em>/ 100</p>
                `;
                
                additionalInfo.appendChild(infoBox);

                initializeKPIs(`posto${posto.id}`, {
                    oee: posto.oee || 0,
                    id: posto.id || 0,
                    ie: posto.ie || 0,
                    iq: posto.iq || 0
                });
                
                sendDataToServer({
                    posto: postoId,
                    data: postoData.Data,
                    hora: postoData.Hora,
                    qtd: postoData.Quantidade,
                    oee: oeeValue,
                    id: idValue,
                    ie: ieValue,
                    iq: iqValue
            });

            updateStatusColors();
        })
        .catch(error => {
            console.error('Erro ao carregar os dados das câmeras:', error);
        });;
}

function updateStatusColors() {
    document.querySelectorAll('.info-box .status').forEach((status) => {
        const statusText = status.textContent.trim();
        if (statusText === "Parado") {
            status.style.backgroundColor = "#ff4a3d"; 
            status.style.color = "#fff"; 
        } else if (statusText === "Operando") {
            status.style.backgroundColor = "#4CAF50"; 
            status.style.color = "#fff"; 
        } else if (statusText === "Sem conexão") {
            status.style.backgroundColor = "#666";
            status.style.color = "#fff";
        }
    });
}

window.onload = function() {
    loadCameraData();
    // Opcional: Atualizar periodicamente
    // setInterval(loadCameraData, 5000); // Atualiza a cada 5 segundos
};
