// static/chart_initializers.js

function initializeProducedPiecesChart(ctx) {
    const productionData = [
        { shift: '1° Turno', pieces: 0 },
        { shift: '2° Turno', pieces: 0 },
        { shift: '3° Turno', pieces: 0 }
    ];

    const data = {
        labels: productionData.map(shift => shift.shift),
        datasets: [
            {
                label: 'Real',
                data: productionData.map(shift => shift.pieces),
                backgroundColor: 'rgb(0, 74, 143)',
                borderRadius: 1
            },
            {
                label: 'Planejado',
                data: [550, 450, 200], // Exemplo fixo
                backgroundColor: 'rgba(211, 211, 211, 1)',
                borderRadius: 5
            }
        ]
    };

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
            title: {
                display: true,
                text: 'Peças Produzidas',
                font: {
                    size: 26
                },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                stacked: false,
            },
            y: {
                stacked: true,
                ticks: {
                    crossAlign: 'far',
                },
            },
        },
    };

    return new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options,
    });
}

function initializeBalanceChart(ctx) {
    const initialData = [
        { ordem: 'Sem Dados', data: [0, 0, 0, 0, 0, 0, 0], color: '#cccccc' }
    ];

    const data = {
        labels: ['Posto 1', 'Posto 2', 'Posto 3', 'Posto 4', 'Posto 5', 'Posto 6'],
        datasets: initialData.map(order => ({
            label: order.ordem,
            data: order.data,
            backgroundColor: order.color,
            maxBarThickness: 40,
            borderRadius: 5,
        }))
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true
            },
            title: {
                display: false,
                text: 'Balanceamento de Produção',
                font: {
                    size: 26
                },
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                categoryPercentage: 0.7,
                barPercentage: 1,     
                grid: {
                    display: false,
                },
                ticks: {
                }
            },
            y: {
                beginAtZero: true
            }
        }
    };

    return new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options,
    });
}

function initializeKPIs(postId, kpis) {
    if (charts[postId]) {
        Object.values(charts[postId]).forEach(chart => chart.destroy());
    }

    charts[postId] = {
        oee: createResponsiveGauge(document.getElementById(`${postId}-oee`), kpis.oee, 100, 'OEE'),
        id:  createResponsiveGauge(document.getElementById(`${postId}-id`), kpis.id, 100, 'ID', '#4caf50'),
        ie:  createResponsiveGauge(document.getElementById(`${postId}-ie`), kpis.ie, 100, 'IE', '#ffc600'),
        iq:  createResponsiveGauge(document.getElementById(`${postId}-iq`), kpis.iq, 100, 'IQ', '#7f02c7')
    };
}

charts.producedPieces = initializeProducedPiecesChart(document.getElementById('produced-pieces-chart').getContext('2d'));
charts.balanceChart = initializeBalanceChart(document.getElementById('balance').getContext('2d'));
updateBalanceChartFromAPI();

charts.oeeGargalo = createGaugeChart(document.getElementById('oee_gargalo').getContext('2d'), 0, 100, 'OEE Gargalo', '#ff4a3d');
charts.oeeGeral   = createGaugeChart(document.getElementById('oee').getContext('2d'), 0, 100, 'OEE', '#004a8f');
charts.idGeral    = createGaugeChart(document.getElementById('id').getContext('2d'), 0, 100, 'ID', '#4caf50');
charts.ieGeral    = createGaugeChart(document.getElementById('ie').getContext('2d'), 0, 100, 'IE', '#ffc600');
charts.iqGeral    = createGaugeChart(document.getElementById('iq').getContext('2d'), 0, 100, 'IQ', '#7f02c7');