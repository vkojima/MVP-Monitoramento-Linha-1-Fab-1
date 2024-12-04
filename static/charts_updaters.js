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