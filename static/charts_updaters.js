function updateProcessFlowFromAPI(){
    fetch('http://10.1.79.17:5000/get_csv_data')
    .then(response => response.json())
    .then(data => {
        updateProcessFlow(data);
    })
    .catch(error => {
        console.error("Erro ao carregar dados do fluxo de processo:", error);
    });
}

function updateProducedPiecesFromAPI() {
    fetch('http://10.1.79.17:5000/get_csv_data')
        .then(response => response.json())
        .then(data => {
            const productionData = calculateProducedPieces(data);
            updateProducedPiecesChart(charts.producedPieces, productionData);
        })
        .catch(error => {
            console.error("Erro ao carregar dados de peças produzidas:", error);
        });
}

function updateIDChartsFromPostos(postos) {
    const recalculatedIDs = recalculateIDs(postos);

    Object.entries(recalculatedIDs).forEach(([postoKey, idValue]) => {
        const postoId = postoKey.replace("Posto", "");
        const idGauge = charts[`posto${postoId}-id`];

        updateGeneralGaugeChart(idGauge, idValue, 100);
        if (idGauge) {
        }

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

function updateTimelineForPosto(postoKey, data, shift) {
    const postoId = postoKey.replace('Posto', '');
    const timelineElementId = `timeline-posto${postoId}`;
    const timelineElement = document.getElementById(timelineElementId);
    // console.log(timelineElementId);
    

    if (!timelineElement) {
        console.warn(`Elemento de timeline para ${postoId} não encontrado.`);
        return;
    }

    const timeline = getShiftStatusTimeline(data, postoKey, shift);
    renderTimeline(postoId, timeline);
}

function updateAllTimelines(data) {
    ['Posto1', 'Posto2', 'Posto3', 'Posto4', 'Posto5', 'Posto6'].forEach(posto => {
        console.log(`Posto: ${posto}`);
        updateTimelineForPosto(posto, data, getCurrentShift());
    });
}

function updateTimelinesFromAPI() {
    fetch('http://10.1.79.17:5000/get_csv_data')
        .then(response => response.json())
        .then(data => {
            const currentShift = getCurrentShift();
            if (!currentShift) {
                console.warn('Nenhum turno atual encontrado.');
                return;
            }

            ['Posto1', 'Posto2', 'Posto3', 'Posto4', 'Posto5', 'Posto6'].forEach(posto => {
                updateTimelineForPosto(posto, data, getCurrentShift());
            });
        })
        .catch(error => {
            console.error("Erro ao carregar dados para timelines:", error);
        });
}

function updateGeneralGaugeChart(chart, newValue, max = 100) {
    if (chart) {
        const validValue = parseFloat(newValue) || 0; 
        const validMax = parseFloat(max) || 1;       

        chart.data.datasets[0].data[0] = validValue;
        chart.data.datasets[0].data[1] = validMax - validValue;
        chart.update(); 
    }
}

function updateGeneralChartsFromPostos(postos) {
    const geralData = calculateGeneralData(postos);

    if (charts.oeeGeral) updateGeneralGaugeChart(charts.oeeGeral, geralData.OEE, 100);
    if (charts.oeeGargalo) updateGeneralGaugeChart(charts.oeeGargalo, geralData.OEEgargalo, 100);
    if (charts.idGeral) updateGeneralGaugeChart(charts.idGeral, geralData.ID, 100);
    if (charts.ieGeral) updateGeneralGaugeChart(charts.ieGeral, geralData.IE, 100);
    if (charts.iqGeral) updateGeneralGaugeChart(charts.iqGeral, geralData.IQ, 100);
}