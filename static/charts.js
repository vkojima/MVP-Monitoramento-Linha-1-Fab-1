// charts/charts.js

function createGaugeChart(ctx, value, max, label, color) {
    if (!color) {
        color = '#004A8F'
    }
        
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [label],
            datasets: [{
                data: [value, max - value],
                backgroundColor: [color, 'rgba(0, 74, 143, 0.1)'],
                borderWidth: 0,
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '80%',
            rotation: -90,
            circumference: 180,
            plugins: {
                tooltip: {
                    enabled: true
                },
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: label,
                    font: {
                        size: 26,
                        color: "#000000",
                    },
                    padding: {
                        bottom: 0,
                        top: 30
                    }
                }
            }
        },
        plugins: [{
            beforeDraw(chart) {
                const width = chart.width,
                      height = chart.height,
                      ctx = chart.ctx;
                ctx.restore();
                const fontSize = (height / 100).toFixed(2);
                ctx.font = `${fontSize}em Arial`;
                ctx.textBaseline = 'middle';
                const text = `${Math.round((value / max) * 100)}%`,
                      textX = Math.round((width - ctx.measureText(text).width) / 2),
                      textY = height / 1.30;
                ctx.fillStyle = '#000000';
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }]
    });
}

function pcsMotor(ctx) {
    const data = {
        labels: ['1° Turno', '2° Turno', '3° Turno'],
        datasets: [
            {
                label: 'Real',
                data: [500, 400, 100],
                backgroundColor: 'rgb(0, 74, 143)',
                borderRadius: 1
            },
            {
                label: 'Planejado',
                data: [550, 450, 200],
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
                max: Math.max(...data.datasets.map(dataset => Math.max(...dataset.data))) + 50,
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

    const calculateBarThickness = () => {
        const chartHeight = ctx.canvas.parentElement.clientHeight || ctx.canvas.height;
        const numberOfBars = data.labels.length;
        return Math.max(10, Math.min(40, chartHeight / (numberOfBars * 4)));
    };

    const updateChart = () => {
        const barThickness = calculateBarThickness();
        chart.data.datasets.forEach(dataset => {
            dataset.barThickness = barThickness;
        });
        chart.update();
    };

    const debounce = (func, delay) => {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(func, delay);
        };
    };

    const chart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            ...options,
            datasets: data.datasets.map(dataset => ({
                ...dataset,
                barThickness: calculateBarThickness(),
            })),
        },
    });

    const handleResize = debounce(() => {
        chart.resize();
        updateChart();
    }, 200);

    window.addEventListener('resize', handleResize);

    return chart;
}

function createBalanceChart(ctx, orders) {
    const labels = ['Posto 1', 'Posto 2', 'Posto 3', 'Posto 4', 'Posto 5', 'Posto 6', 'Posto 7'];
    let currentFilter = 'Geral';
    
    
    const generateDatasets = (filter) => {
        if (filter === 'Geral') {
            return orders.map(order => ({
                label: order.ordem,
                data: order.data,
                backgroundColor: order.color || `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.7)`,
                maxBarThickness: 40,
                borderRadius: 5,
                // barThickness: calculateBarThickness(), // Removido
            }));
        } else {
            const filteredOrder = orders.find(order => order.ordem === filter);
            return filteredOrder
                ? [{
                    label: filteredOrder.ordem,
                    data: filteredOrder.data,
                    backgroundColor: filteredOrder.color || 'rgba(0, 74, 143, 0.7)',
                    maxBarThickness: 40,
                    borderRadius: 5,
                    // barThickness: calculateBarThickness(), // Removido
                }]
                : [];
        }
    };

    const dashedLinePlugin = {
        id: 'dashedLinePlugin',
        afterDraw(chart) {
            const { ctx, scales } = chart;
            const yAxis = scales.y;
            const xAxis = scales.x;
    
            const value = 30;
    
            const yPosition = yAxis.getPixelForValue(value);
    
            ctx.save();
            ctx.strokeStyle = 'red'; // Cor da linha
            ctx.setLineDash([5, 5]); // Traço: 5px, Espaço: 5px
            ctx.lineWidth = 2;
    
            // Desenha a linha
            ctx.beginPath();
            ctx.moveTo(xAxis.left, yPosition); // Início da linha (esquerda)
            ctx.lineTo(xAxis.right, yPosition); // Fim da linha (direita)
            ctx.stroke();
    
            ctx.restore();
        }
    };

    const data = {
        labels: labels,
        datasets: generateDatasets(currentFilter),
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true
            },
        },
        scales: {
            x: { // Configuração do eixo X adicionada
                beginAtZero: true,
                categoryPercentage: 0.7, // Ajusta o espaçamento entre categorias
                barPercentage: 1,      // Ajusta o espaçamento entre barras dentro da mesma categoria
                grid: {
                    display: false, // Opcional: desativa as linhas de grade no eixo X
                },
                ticks: {
                    // Configurações adicionais para os ticks do eixo X, se necessário
                }
            },
            y: {
                beginAtZero: true
            }
        }
    };

    const chart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options,
        plugins: [dashedLinePlugin],
    });

    const filtersContainer = document.getElementById('filters');

    const updateChart = (filter) => {
        currentFilter = filter;
        chart.data.datasets = generateDatasets(currentFilter);
        // const barThickness = calculateBarThickness();
        // chart.data.datasets.forEach(dataset => {
        //     dataset.barThickness = barThickness;
        // });
        chart.update();
    };

    const createFilterButton = (label) => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.textContent = label;
        button.addEventListener('click', () => updateChart(label));
        filtersContainer.appendChild(button);
    };

    orders.forEach(order => createFilterButton(order.ordem));

    const debounce = (func, delay) => {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(func, delay);
        };
    };

    const handleResize = debounce(() => {
        const barThickness = calculateBarThickness();
        chart.data.datasets.forEach(dataset => {
            dataset.barThickness = barThickness;
        });
        chart.resize();
        chart.update();
    }, 200);

    window.addEventListener('resize', handleResize);
}



function createResponsiveGauge(ctx, value, max, label, color) {
    const parent = ctx.parentNode;
    const width = parent.offsetWidth;
    const size = Math.min(width * 0.4, 120);

    if (!color){
        color = '#004A8F'
    }

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [label],
            datasets: [{
                data: [value, max - value],
                backgroundColor: [color, '#ececec'],
                borderWidth: 0,
                borderRadius: 2.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: `75%`,
            rotation: -90,
            circumference: 180,
            plugins: {
                tooltip: {
                    enabled: false
                },
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: label,
                    position: 'bottom',
                    align: 'center',
                    font: {
                        size: Math.max(20, size * 0.2)
                    },
                    padding: {
                        top: -40,
                        bottom: 75,
                    },
                }
            }
        },
        plugins: [{
            beforeDraw(chart) {
                const ctx = chart.ctx;
                const width = chart.width;
                const height = chart.height;
                ctx.restore();

                const fontSize = Math.max(10, height * 0.135); // Ajuste proporcional à altura
                ctx.font = `${fontSize}px Arial`;
                ctx.textBaseline = 'middle';

                const text = `${Math.round((value / max) * 100)}%`;
                const textX = Math.round((width - ctx.measureText(text).width) / 2); // Centraliza horizontalmente
                const textY = height / 1.8; // Ajusta verticalmente

                ctx.fillStyle = '#004A8F';
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }]
    });
}

function initializeKPIs(postId, kpis) {
    createResponsiveGauge(document.getElementById(`${postId}-oee`), kpis.oee, 100, 'OEE');
    createResponsiveGauge(document.getElementById(`${postId}-id`), kpis.id, 100, 'ID', '#4caf50');
    createResponsiveGauge(document.getElementById(`${postId}-ie`), kpis.ie, 100, 'IE', '#ffc600');
    createResponsiveGauge(document.getElementById(`${postId}-iq`), kpis.iq, 100, 'IQ', '#7f02c7');
}

const postsKPIs = {
    // geral0: {oee: 85, id: 90, ie: 75, iq: 80 },
    posto1: {oee: 65, id: 80, ie: 81, iq: 99 },
    posto2: {oee: 77, id: 85, ie: 92, iq: 98 },
    posto3: {oee: 0, id: 0, ie: 0, iq: 0 },
    posto4: {oee: 0, id: 0, ie: 0, iq: 0 },
    posto5: {oee: 0, id: 0, ie: 0, iq: 0 },
    posto6: {oee: 0, id: 0, ie: 0, iq: 0 },
    posto7: {oee: 0, id: 0, ie: 0, iq: 0 },
};

Object.entries(postsKPIs).forEach(([postId, kpis]) => {
    initializeKPIs(postId, kpis);
});

createBalanceChart(document.getElementById('balance').getContext('2d'), orders = [
    { ordem: 'Geral', data: [12, 14, 16, 18, 20, 22, 24], color: '#005cb4' },
    { ordem: 'Ordem 1', data: [10, 15, 20, 10, 5, 12, 8], color: '#004A8F' },
    { ordem: 'Ordem 2', data: [5, 10, 15, 20, 25, 30, 35], color: '#005db5' },
    { ordem: 'Ordem 3', data: [20, 18, 16, 14, 12, 10, 8], color: '#0070db' },
    { ordem: 'Ordem 4', data: [12, 14, 16, 18, 20, 22, 24], color: '#005cb4' },       
    ],);

const ctx5 = document.getElementById('pcs').getContext('2d');

// balance(ctx0);
createGaugeChart(document.getElementById('oee').getContext('2d'), 75, 100, 'OEE')
createGaugeChart(document.getElementById('id').getContext('2d'), 85, 100, 'ID', '#4caf50') //  
createGaugeChart(document.getElementById('ie').getContext('2d'), 91, 100, 'IE', '#ffc600') //  
createGaugeChart(document.getElementById('iq').getContext('2d'), 97, 100, 'IQ', '#7f02c7') //  

pcsMotor(ctx5)