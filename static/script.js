// static/script.js

const charts = {};
const historicalCharts = {};

function loadCameraData() {
    fetch('http://10.1.79.17:4000/tracking_info')
        .then(response => response.json())
        .then(data => {
            const currentShift = getCurrentShift();
            const turnoInicio = currentShift.start;
            const turnoFim = currentShift.end;
            const apiUrl = `http://localhost:5000/get_posto_ids?turno_inicio=${turnoInicio}&turno_fim=${turnoFim}`;
        
            fetch(apiUrl)                
            .then(idResponse => idResponse.json())
                .then(idData => {
                    if (idData.status === "success" && idData.ids) {
                        const ids = idData.ids;

                        Object.keys(data).forEach(postoKey => {
                            if (ids[postoKey]) {
                                data[postoKey].ID = ids[postoKey].toFixed(2) + "%";
                            }
                        });

                        processCameraData(data);
                    } else {
                        console.error("Erro ao obter IDs da API:", idData.message);
                    }
                })
                .catch(error => {
                    console.error("Erro ao se conectar à API de IDs:", error);
                });
        })
        .catch(error => {
            console.error('Erro ao carregar os dados dos postos:', error);
        });
}

function processCameraData(data) {
    const additionalInfo = document.getElementById('additional-info');

    Object.entries(data).forEach(([postoKey, postoData]) => {
        const postoId = postoKey.replace('Posto', '');
        const infoBoxId = `info-box-posto${postoId}`;

        if (!postoData || typeof postoData !== 'object') {
            console.warn(`Dados incompletos ou não são um objeto para ${postoKey}`);
            return;
        }

        let infoBox = document.getElementById(infoBoxId);
        if (!infoBox) {
            infoBox = document.createElement('div');
            infoBox.className = 'info-box';
            infoBox.id = infoBoxId;

            const cameraURLs = {
                Posto1: "http://10.1.60.155:4000/video_feed",
                Posto2: "http://10.1.60.183:4000/video_feed",
                // Posto3: "http://10.1.60.156:4000/video_feed",
                // Posto4: "http://10.1.60.157:4000/video_feed",
                // Posto5: "http://10.1.60.158:4000/video_feed",
                // Posto6: "http://10.1.60.159:4000/video_feed",
            };
            
            let cameraURL = cameraURLs[postoKey] || "/video_feed/default"; // URL padrão, se não houver mapeamento

            infoBox.innerHTML = `
                <header>
                    <h2>Posto ${postoId}</h2>
                    <div class="status"></div>
                </header>
                <img src="${cameraURL}" alt="Câmera ao Vivo">
                <div class="gauges">
                    <div class="gauge"><canvas id="posto${postoId}-oee"></canvas></div>
                    <div class="gauge"><canvas id="posto${postoId}-id"></canvas></div>
                    <div class="gauge"><canvas id="posto${postoId}-ie"></canvas></div>
                    <div class="gauge"><canvas id="posto${postoId}-iq"></canvas></div>
                </div>
                <p>Data/Hora: <em>${postoData.Data?.split('/').slice(0, 2).join('/')} ${postoData.Hora?.split(':').slice(0, 2).join(':')}</em></p>
                <p>Qtd. Produzida: <em>${postoData.Quantidade}</em></p>
                <p>Ordem: <em>${postoData.Ordem}</em></p>
            `;


            document.getElementById('additional-info').appendChild(infoBox);

            initializeKPIs(`posto${postoId}`, {
                oee: calculateOEE(postoData.ID, postoData.IE, postoData.IQ),
                id: parseFloat(postoData.ID.replace('%', '')) || 0,
                ie: parseFloat(postoData.IE.replace('%', '')) || 0,
                iq: parseFloat(postoData.IQ.replace('%', '')) || 0
            });
        } else {
            initializeKPIs(`posto${postoId}`, {
                oee: calculateOEE(postoData.ID, postoData.IE, postoData.IQ),
                id: parseFloat(postoData.ID.replace('%', '')) || 0,
                ie: parseFloat(postoData.IE.replace('%', '')) || 0,
                iq: parseFloat(postoData.IQ.replace('%', '')) || 0
            });
        }
        
        const status = postoData.Status;
        infoBox.querySelector('.status').textContent = status;

        updateStatusColors();

        sendDataToServer({
            posto: postoKey,
            data: postoData.Data,
            hora: postoData.Hora,
            status: postoData.Status,
            ordem: postoData.Ordem,
            qtd: postoData.Quantidade,
            oee: calculateOEE(postoData.ID, postoData.IE, postoData.IQ),
            id: parseFloat(postoData.ID.replace('%', '')) || 0,
            ie: parseFloat(postoData.IE.replace('%', '')) || 0,
            iq: parseFloat(postoData.IQ.replace('%', '')) || 0
        });
    });

    updateGeneralChartsFromPostos(data);
    updateProducedPiecesFromAPI();
    updateProcessFlowFromAPI();
}

function calculateOEE(id = '0%', ie = '0%', iq = '0%') {
    const idValue = parseFloat(id.replace('%', '')) || 0;
    const ieValue = parseFloat(ie.replace('%', '')) || 0;
    const iqValue = parseFloat(iq.replace('%', '')) || 0;
    return ((idValue * ieValue * iqValue) / 10000).toFixed(2);
}

function parseTimestamp(data, hora) {
    const [day, month, year] = data.split('/');
    const isoDate = `20${year}-${month}-${day}T${hora}`;
    console.log(new Date(isoDate))
    return new Date(isoDate);
}

function isTimeInShift(time, shiftStart, shiftEnd) {
    const start = parseTime(shiftStart);
    const end = parseTime(shiftEnd);

    if (end > start) {
        return time >= start && time < end;
    } else {
        return time >= start || time < end;
    }
}

function updateDashboardWithID(data) {
    const currentShift = getCurrentShift();
    console.log(`Turno atual: ${currentShift ? `${currentShift.start} - ${currentShift.end}` : 'Nenhum'}`);

    if (!currentShift) {
        console.warn('Nenhum turno atual encontrado.');
        return;
    }

    Object.keys(data).forEach(postoKey => {
        const postoId = postoKey.replace('Posto', '');
        const idValue = calculateIDForPostoByShift(data, postoKey, currentShift);

        const idGauge = charts[`posto${postoId}-id`];
        if (idGauge) {
            updateResponsiveGauge(idGauge, parseFloat(idValue), 100);
        }

        console.log(`ID atualizado para o Posto ${postoId}: ${idValue}%`);
    });
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
        } else if (statusText === "Sem conexao") {
            status.style.backgroundColor = "#666";
            status.style.color = "#fff";
        }
    });
}

function sendDataToServer(data) {
    fetch('http://10.1.79.17:5000/save_data', { // Certifique-se que a URL está correta
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao enviar dados para o servidor');
        }
        return response.json();
    })
    // .then(result => {
    //     console.log('Dados salvos com sucesso:', result);
    // })
    .catch(error => {
        console.error('Erro ao enviar dados para o servidor:', error);
    });
}

function calculateSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
        console.warn(`Hora inválida: ${timeStr}`);
        return 0;
    }
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

function updateTimelineForPosto(postoId, data) {
    const postoKey = `Posto${postoId}`;
    const postoData = data[postoKey];

    const shift = getCurrentShift();
    const timeline = getShiftStatusTimeline(data, shift);

    renderTimeline(postoId, timeline, shift);
}

function highlightBottleneckPosto(data) {
    let bottleneckPosto = null;
    let lowestOEE = 101;

    Object.values(data).forEach(entry => {
        const oee = parseFloat(entry.OEE.replace('%', '')) || 0;
        if (oee < lowestOEE) {
            lowestOEE = oee;
            bottleneckPosto = entry.Posto;
        }
    });

    document.querySelectorAll('.info-box').forEach(infoBox => {
        infoBox.classList.remove('gargalo');
    });

    if (bottleneckPosto) {
        const bottleneckElement = document.getElementById(`info-box-posto${bottleneckPosto.replace('Posto', '')}`);
        if (bottleneckElement) {
            bottleneckElement.classList.add('gargalo');
        }
    }
}

function loadIDs() {
    const currentShift = getCurrentShift();
    const turnoInicio = currentShift.start;
    const turnoFim = currentShift.end;
    const apiUrl = `http://localhost:5000/get_posto_ids?turno_inicio=${turnoInicio}&turno_fim=${turnoFim}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                updateDashboardWithIDs(data.ids);
                console.log(data.ids);
                return data.ids;
            } else {
                console.error("Erro ao obter IDs:", data.message);
            }
        })
        .catch(error => {
            console.error("Erro ao se conectar à API:", error);
        });
}

function updateDashboardWithIDs(ids) {
    Object.entries(ids).forEach(([postoKey, idValue]) => {
        const postoId = postoKey.replace("Posto", ""); 
        const idGauge = charts[`posto${postoId}-id`];
        initializeKPIs(`posto${postoId}`, {
            id: parseFloat(idValue) || 0,
        })


        const infoBox = document.getElementById(`info-box-posto${postoId}`);
        if (infoBox) {
            const idDisplay = infoBox.querySelector('.gauge-value');
            if (idDisplay) {
                idDisplay.textContent = `${idValue.toFixed(2)}%`;
            }
        }
        console.log(`ID atualizado para o Posto ${postoId}: ${idValue.toFixed(2)}%`);
    });
}

function recalculateIDs(postos) {
    const recalculatedIDs = {};

    Object.entries(postos).forEach(([postoKey, postoData]) => {
        const entries = postoData.entries || []; 
        const shift = getCurrentShift();

        if (!shift || entries.length < 2) {
            console.warn(`Não é possível recalcular ID para ${postoKey}: turno ou entradas insuficientes.`);
            recalculatedIDs[postoKey] = 0;
            return;
        }

        const shiftStart = new Date();
        shiftStart.setHours(...shift.start.split(':').map(Number), 0, 0);

        const shiftEnd = new Date();
        shiftEnd.setHours(...shift.end.split(':').map(Number), 0, 0);
        if (shiftEnd <= shiftStart) shiftEnd.setDate(shiftEnd.getDate() + 1);

        let totalTime = 0;
        let operationTime = 0;

        for (let i = 0; i < entries.length - 1; i++) {
            const currentTime = new Date(`${entries[i].Data} ${entries[i].Hora}`);
            const nextTime = new Date(`${entries[i + 1].Data} ${entries[i + 1].Hora}`);

            if (currentTime >= shiftStart && nextTime <= shiftEnd) {
                const timeDifference = (nextTime - currentTime) / 1000; // Em segundos
                totalTime += timeDifference;
                if (entries[i].Status === true) {
                    operationTime += timeDifference;
                }
            }
        }

        const idValue = totalTime > 0 ? ((operationTime / totalTime) * 100).toFixed(2) : 0;
        recalculatedIDs[postoKey] = parseFloat(idValue);
    });

    return recalculatedIDs;
}

function updateStatusBar() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('status-datetime').textContent = `Data: ${formattedDate} | Hora: ${formattedTime} | ${getCurrentShift().name}`;
}

setInterval(updateStatusBar, 1000);

window.onload = function() {
    loadCameraData();
    setInterval(loadCameraData, 10000); 
};