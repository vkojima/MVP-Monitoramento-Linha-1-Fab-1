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
        animation : {
            duration : 0,
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
        animation : {
            duration : 0,
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
                    font: {
                        size: 14,
                    },
                },
            },
            y: {
                beginAtZero: true
            }
        }
    };

    const dashedLinePlugin = {
        id: 'dashedLinePlugin',
        afterDraw(chart) {
            const { ctx, scales } = chart;
            const yAxis = scales.y;
            const xAxis = scales.x;
            const value = 0.5;
    
            const yPosition = yAxis.getPixelForValue(value);
    
            ctx.save();
            ctx.strokeStyle = 'red'; 
            ctx.setLineDash([5, 5]); 
            ctx.lineWidth = 2;
    
            ctx.beginPath();
            ctx.moveTo(xAxis.left, yPosition); 
            ctx.lineTo(xAxis.right, yPosition); 
            ctx.stroke();
    
            ctx.restore();
        }
    };

    return new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options,
        plugins: [dashedLinePlugin],
    });
}

function initializeKPIs(postId, kpis) {
    if (!charts[postId]) {
        charts[postId] = {}; // Inicializa o objeto de charts se ainda não existir
    }

    Object.entries(kpis).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            // Destrói o chart existente apenas se o KPI for atualizado
            if (charts[postId][key]) {
                charts[postId][key].destroy();
            }

            // Cria um novo chart apenas para o KPI atualizado
            const elementId = `${postId}-${key}`;
            let label = key.toUpperCase();
            let color;

            switch (key) {
                case 'id':
                    color = '#4caf50';
                    break;
                case 'ie':
                    color = '#ffc600';
                    break;
                case 'iq':
                    color = '#7f02c7';
                    break;
                default:
                    color = undefined;
            }

            charts[postId][key] = createResponsiveGauge(
                document.getElementById(elementId),
                value,
                100,
                label,
                color
            );
        }
    });
}


charts.producedPieces = initializeProducedPiecesChart(document.getElementById('produced-pieces-chart').getContext('2d'));
charts.balanceChart = initializeBalanceChart(document.getElementById('balance').getContext('2d'));
updateBalanceChartFromAPI();

charts.oeeGargalo = createGaugeChart(document.getElementById('oee_gargalo').getContext('2d'), 0, 100, 'OEE Gargalo', '#ff4a3d');
charts.oeeGeral   = createGaugeChart(document.getElementById('oee').getContext('2d'), 0, 100, 'OEE', '#004a8f');
charts.idGeral    = createGaugeChart(document.getElementById('id').getContext('2d'), 0, 100, 'ID', '#4caf50');
charts.ieGeral    = createGaugeChart(document.getElementById('ie').getContext('2d'), 0, 100, 'IE', '#ffc600');
charts.iqGeral    = createGaugeChart(document.getElementById('iq').getContext('2d'), 0, 100, 'IQ', '#7f02c7');