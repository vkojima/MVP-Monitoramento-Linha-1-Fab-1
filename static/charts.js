// static/charts.js

const shifts = [
    { name: "1° Turno", start: "06:00:00", end: "14:00:00" },
    { name: "2° Turno", start: "14:00:00", end: "22:00:00" },
    { name: "3° Turno", start: "22:00:00", end: "06:00:00" }
];

const pcsMotorChart = {}; // Armazenar a instância do gráfico de peças produzidas

function createGaugeChart(ctx, value, max, label, color) {
    if (!color) {
        color = '#004A8F';
    }

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [label, 'Restante'],
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
            animation : {
                duration : 0,
            },
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
                const { width, height, ctx } = chart;
                ctx.save();
        
                const dataset = chart.data.datasets[0].data;
                const value = dataset[0] || 0; // Valor atual, padrão 0 se não definido
                const max = dataset.reduce((a, b) => a + b, 0) || 1; // Evita divisão por 0
        
                const percentage = Math.round((value / max) * 100);
        
                const text = `${percentage}%`;
                const textX = Math.round((width - ctx.measureText(text).width) / 2.4);
                const textY = height / 1.2;
        
                ctx.font = `${Math.max(10, height * 0.155)}px Arial`;
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#000000';
                ctx.fillText(text, textX, textY);
                ctx.restore();
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
        // const barThickness = calculateBarThickness(); // ! Está dando erro
        // chart.data.datasets.forEach(dataset => {
        //     dataset.barThickness = barThickness;
        // });
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
        color = '#004A8F';
    }

    const gaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [label, 'Restante'],
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
            cutout: '75%',
            rotation: -90,
            circumference: 180,
            animation : {
                duration : 0,
            },
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

                const fontSize = Math.max(10, height * 0.155); 
                ctx.font = `${fontSize}px Arial`;
                ctx.textBaseline = 'middle';

                const text = `${Math.round((value / max) * 100)}%`;
                const textX = Math.round((width - ctx.measureText(text).width) / 1.9); 
                const textY = height / 1.8; 

                ctx.fillStyle = '#000000';
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }]
    });
    return gaugeChart;
}

function updateResponsiveGauge(chart, newValue, max = 100) {
    chart.data.datasets[0].data[0] = newValue;
    chart.data.datasets[0].data[1] = max - newValue;
    chart.options.plugins.beforeDraw = [{
        beforeDraw: function(chart) {
            const ctx = chart.ctx;
            const width = chart.width;
            const height = chart.height;
            ctx.restore();

            const fontSize = Math.max(10, height * 0.135); // Ajuste proporcional à altura
            ctx.font = `${fontSize}px Arial`;
            ctx.textBaseline = 'middle';

            const text = `${Math.round((newValue / max) * 100)}%`;
            const textX = Math.round((width - ctx.measureText(text).width) / 2); // Centraliza horizontalmente
            const textY = height / 1.8; // Ajusta verticalmente

            ctx.fillStyle = chart.data.datasets[0].backgroundColor[0];
            ctx.fillText(text, textX, textY);
            ctx.save();
        }
    }];
    chart.update();
}

function updateHistoricalChart(postoId) {
    fetch('http://10.1.79.17:5000/get_csv_data') 
        .then(response => response.json())
        .then(data => {
            const postoKey = `Posto${postoId}`;
            const postoDataArray = data.filter(entry => entry.Posto === postoKey);
            if (postoDataArray.length === 0) {
                console.warn(`Nenhum dado histórico encontrado para Posto${postoId}`);
                return;
            }

            const historicalChartId = `historical-chart-posto${postoId}`;
            const historicalCtx = document.getElementById(historicalChartId).getContext('2d');

            const labels = postoDataArray.map(entry => new Date(entry.Timestamp));
            const quantidade = postoDataArray.map(entry => entry.Quantidade);
            const tempoDecorrido = postoDataArray.map(entry => calculateSeconds(entry.TempoDecorrido));
            const tempoPlanejado = postoDataArray.map(entry => calculateSeconds(entry.TempoPlanejado));

            if (!historicalCharts[postoId]) {
                historicalCharts[postoId] = new Chart(historicalCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Quantidade Produzida',
                                data: quantidade,
                                borderColor: 'rgba(75, 192, 192, 1)',
                                fill: false,
                                tension: 0.1
                            },
                            {
                                label: 'Tempo Decorrido (s)',
                                data: tempoDecorrido,
                                borderColor: 'rgba(153, 102, 255, 1)',
                                fill: false,
                                tension: 0.1
                            },
                            {
                                label: 'Tempo Planejado (s)',
                                data: tempoPlanejado,
                                borderColor: 'rgba(255, 159, 64, 1)',
                                fill: false,
                                tension: 0.1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation : {
                            duration : 0,
                        },
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    parser: 'YYYY-MM-DDTHH:mm:ss.SSSZ', // Formato ISO padrão
                                    tooltipFormat: 'll HH:mm',
                                    unit: 'minute',
                                    displayFormats: {
                                        minute: 'HH:mm'
                                    }
                                },
                                title: {
                                    display: true,
                                    text: 'Horário'
                                }
                            },
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Valores'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        animation : {
                            duration : 0,
                        },
                    }
                });
            } else {
                const chart = historicalCharts[postoId];
                chart.data.labels = labels;
                chart.data.datasets[0].data = quantidade;
                chart.data.datasets[1].data = tempoDecorrido;
                chart.data.datasets[2].data = tempoPlanejado;
                chart.update();
            }
        })
        .catch(error => {
            console.error(`Erro ao carregar dados históricos para Posto ${postoId}:`, error);
        });
}

function calculateGeneralData(postos) {
    let totalID = 0, totalIE = 0, totalIQ = 0, minOEE = null;
    let count = 0;

    Object.values(postos).forEach((postoData) => {
        const idValue  = postoData.ID  ? parseFloat(postoData.ID.replace('%', ''))  || 0 : 0;
        const ieValue  = postoData.IE  ? parseFloat(postoData.IE.replace('%', ''))  || 0 : 0;
        const iqValue  = postoData.IQ  ? parseFloat(postoData.IQ.replace('%', ''))  || 0 : 0;
        const oeeValue = idValue * ieValue * iqValue / 10000;

        totalID += idValue;
        totalIE += ieValue;
        totalIQ += iqValue;

        if (oeeValue !== null && (minOEE === null || oeeValue < minOEE)) {
            minOEE = oeeValue;
        }

        count++;
    });
    
    return {
        ID: count > 0 ? (totalID / count).toFixed(2) : "0.00",
        IE: count > 0 ? (totalIE / count).toFixed(2) : "0.00",
        IQ: count > 0 ? (totalIQ / count).toFixed(2) : "0.00",
        OEE: count > 0 ? ((totalID / count) * (totalIE / count) * (totalIQ / count) / 10000).toFixed(2) : "0.00",
        OEEgargalo: minOEE !== null ? minOEE.toFixed(2) : "0.00"
    };
}


function getProducedPiecesByShift(data, shifts) {
    const posto6Data = data.filter(entry => entry.Posto === "Posto6");

    const shiftProduction = shifts.map(shift => {
        const totalPieces = posto6Data.reduce((acc, entry) => {
            const entryTime = entry.Hora;
            if (isInShift(entryTime, shift.start, shift.end)) {
                return acc + (parseInt(entry.Quantidade, 10) || 0);
            }
            return acc;
        }, 0);
        return { shift: shift.name, pieces: totalPieces };
    });
    
    return shiftProduction;
}

function isInShift(time, start, end) {
    const timeDate = new Date(`1970-01-01T${time}`);
    const startDate = new Date(`1970-01-01T${start}`);
    const endDate = new Date(`1970-01-01T${end}`);
    
    if (endDate < startDate) { 
        return timeDate >= startDate || timeDate < endDate;
    }
    return timeDate >= startDate && timeDate < endDate;
}

function calculateProducedPieces(data) {
    const posto6Data = data.filter(entry => entry.Posto === 'Posto6');

    const latestQuantitiesByOrder = posto6Data.reduce((acc, entry) => {
        const ordem = entry.Ordem || 'Sem Ordem';
        const timestamp = new Date(`${entry.Data} ${entry.Hora}`);

        if (!acc[ordem] || timestamp > acc[ordem].timestamp) {
            acc[ordem] = {
                quantidade: parseInt(entry.Quantidade, 10) || 0,
                timestamp: timestamp
            };
        }

        return acc;
    }, {});

    const productionByShift = [
        { shift: '1° Turno', start: '06:00', end: '14:00', pieces: 0 },
        { shift: '2° Turno', start: '14:00', end: '22:00', pieces: 0 },
        { shift: '3° Turno', start: '22:00', end: '06:00', pieces: 0 }
    ];

    Object.values(latestQuantitiesByOrder).forEach(({ quantidade, timestamp }) => {
        const [hour, minute] = [timestamp.getHours(), timestamp.getMinutes()];
        const currentMinutes = hour * 60 + minute;

        productionByShift.forEach(shift => {
            const [startHour, startMinute] = shift.start.split(':').map(Number);
            const [endHour, endMinute] = shift.end.split(':').map(Number);

            let shiftStartMinutes = startHour * 60 + startMinute;
            let shiftEndMinutes = endHour * 60 + endMinute;

            if (shiftEndMinutes <= shiftStartMinutes) {
                if (currentMinutes >= shiftStartMinutes || currentMinutes < shiftEndMinutes) {
                    shift.pieces += quantidade;
                }
            } else {
                if (currentMinutes >= shiftStartMinutes && currentMinutes < shiftEndMinutes) {
                    shift.pieces += quantidade;
                }
            }
        });
    });

    return productionByShift;
}

function updateBalanceChartFromAPI() {
    fetch('http://10.1.79.17:5000/get_csv_data')
        .then(response => response.json())
        .then(data => {
            const balanceData = calculateBalanceData(data);
            updateBalanceChart(charts.balanceChart, balanceData);
        })
        .catch(error => {
            console.error("Erro ao carregar dados de balanceamento:", error);
        });
}

function calculateBalanceData(data) {
    const fixedColors = [
        '#005cb4',  
        '#007fc2',  
        '#198580',  
        '#00c9a5',  
        '#53aaff'
    ];

    const balanceByOrder = {};

    data.forEach(entry => {
        const posto = entry.Posto;
        const ordem = entry.Ordem || 'Sem Ordem';
        const timestamp = new Date(`${entry.Data} ${entry.Hora}`);
        const quantidade = parseInt(entry.Quantidade, 10) || 0;

        if (!balanceByOrder[ordem]) {
            balanceByOrder[ordem] = {};
        }

        if (!balanceByOrder[ordem][posto]) {
            balanceByOrder[ordem][posto] = {
                totalTime: 0,
                totalQuantities: 0,
                lastTimestamp: timestamp
            };
        }

        const postoData = balanceByOrder[ordem][posto];

        if (postoData.lastTimestamp) {
            const timeDiff = (timestamp - postoData.lastTimestamp) / 1000; // Diferenca em segundos
            postoData.totalTime += timeDiff;
        }

        postoData.lastTimestamp = timestamp;
        postoData.totalQuantities += quantidade;
    });

    const orders = Object.keys(balanceByOrder).map((ordem, index) => ({
        ordem,
        data: ['Posto1', 'Posto2', 'Posto3', 'Posto4', 'Posto5', 'Posto6'].map(posto => {
            const postoData = balanceByOrder[ordem][posto];
            if (!postoData || postoData.totalQuantities === 0) {
                return 0; 
            }
            return postoData.totalTime / postoData.totalQuantities; 
        }),
        color: fixedColors[index % fixedColors.length] 
    }));

    return orders;
}


function updateBalanceChart(chart, balanceData) {
    if (!chart) return;

    chart.data.datasets = balanceData.map(order => ({
        label: order.ordem,
        data: order.data,
        backgroundColor: order.color,
        maxBarThickness: 40,
        borderRadius: 5,
    }));

    chart.update();
}

function updateProducedPiecesChart(chart, productionData) {
    if (!chart) return;

    const realData = productionData.map(shift => shift.pieces);
    const plannedData = [0, 0, 0]; 

    chart.data.datasets[0].data = realData; 
    chart.data.datasets[1].data = plannedData; 
    chart.update();
}

function getCurrentShift() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (let shift of shifts) {
        const [startHour, startMinute] = shift.start.split(':').map(Number);
        const [endHour, endMinute] = shift.end.split(':').map(Number);
        const start = startHour * 60 + startMinute;
        const end = endHour * 60 + endMinute;

        if (end > start) {
            if (currentTime >= start && currentTime < end) {
                return shift;
            }
        } else {
            if (currentTime >= start || currentTime < end) {
                return shift;
            }
        }
    }
    return null;
}

function getShiftStatusTimeline(data, posto, shift) {
    const { start: startTime, end: endTime } = shift;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const shiftStart = new Date(`${yyyy}-${mm}-${dd}T${startTime}`);
    const shiftEnd = new Date(`${yyyy}-${mm}-${dd}T${endTime}`);

    if (shiftEnd <= shiftStart) {
        shiftEnd.setDate(shiftEnd.getDate() + 1);
    }

    const dataArray = Object.values(data).filter(entry => {
        const [day, month, year] = entry.Data.split('/'); 
        const formattedDate = `20${year}-${month}-${day}`; 

        const entryTime = new Date(`${formattedDate}T${entry.Hora}`);
        return entry.Posto === posto && entryTime >= shiftStart && entryTime <= shiftEnd;
    });

    dataArray.sort((a, b) => new Date(`${a.Data}T${a.Hora}`) - new Date(`${b.Data}T${b.Hora}`));

    const timeline = [];
    let currentStatus = null;
    let currentStart = shiftStart;

    dataArray.forEach(entry => {
        const entryTime = new Date(`${entry.Data}T${entry.Hora}`);
        const status = entry.Status ? 'operando' : 'parado';

        if (currentStatus === null) {
            currentStatus = status;
            currentStart = shiftStart;
        }

        if (status !== currentStatus) {
            timeline.push({
                status: currentStatus,
                start: currentStart,
                end: entryTime
            });
            currentStatus = status;
            currentStart = entryTime;
        }
    });

    if (currentStatus !== null) {
        timeline.push({
            status: currentStatus,
            start: currentStart,
            end: shiftEnd
        });
    }

    return timeline;
}


function renderTimeline(posto, timeline) {
    const timelineElement = document.getElementById(`timeline-posto${posto}`);
    if (!timelineElement) {
        console.warn(`Elemento de timeline para ${posto} não encontrado.`);
        return;
    }

    timelineElement.innerHTML = ''; 

    if (timeline.length === 0) {
        timelineElement.innerHTML = '<div class="timeline-segment grey" style="width: 100%;"></div>';
        return;
    }

    const shiftStart = timeline[0].start;
    const shiftEnd = timeline[timeline.length - 1].end;
    const shiftDuration = shiftEnd - shiftStart;

    timeline.forEach(segment => {
        console.log(segment)
        const duration = segment.end - segment.start;
        const percentage = (duration / shiftDuration) * 100;

        const segmentDiv = document.createElement('div');
        segmentDiv.className = 'timeline-segment';
        segmentDiv.style.width = `${percentage}%`;
        segmentDiv.style.backgroundColor = segment.status === 'operando' ? '#4CAF50' : '#FF4A3D';
        segmentDiv.style.height = '100%';

        timelineElement.appendChild(segmentDiv);
    });
}

function updateProcessFlow(data) {
    const processFlowElement = document.querySelector('.process-flow');
    let totalTime = 0;

    const lastOrder = data.reduce((acc, curr) => {
        if (!acc || curr.Ordem > acc.Ordem) {
            return curr;
        }
        return acc;
    }, null)?.Ordem;
    
    if (!lastOrder) {
        console.warn("Nenhuma ordem encontrada para o fluxo de processo.");
        return;
    }

    const lastOrderData = data.filter(entry => entry.Ordem === lastOrder);

    const cycleTimesByPost = {};
    lastOrderData.forEach((entry) => {
        const posto = entry.Posto;
        const timestamp = new Date(`${entry.Data} ${entry.Hora}`);

        if (!cycleTimesByPost[posto]) {
            cycleTimesByPost[posto] = { times: [], lastTimestamp: null };
        }

        if (cycleTimesByPost[posto].lastTimestamp) {
            const diff = (timestamp - cycleTimesByPost[posto].lastTimestamp) / 1000; // Diferença em segundos
            cycleTimesByPost[posto].times.push(diff);
        }

        cycleTimesByPost[posto].lastTimestamp = timestamp;
    });

    const averageCycleTimes = Object.keys(cycleTimesByPost).map((posto) => {
        const times = cycleTimesByPost[posto].times;
        return {
            posto,
            averageCycleTime: times.length > 0
                ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)
                : "N/A"
        };
    });

    averageCycleTimes.forEach(({ posto, averageCycleTime }) => {
        const flowElement = document.getElementById(`flow-${posto}`);
        
        if (flowElement) {
            flowElement.textContent = `${averageCycleTime}s`;

            flowElement.classList.remove('green', 'red', 'grey');

            if (averageCycleTime !== "N/A") {
                const cycleTime = parseFloat(averageCycleTime);
                if (cycleTime < 39.66) { 
                    flowElement.classList.add('green');
                } else if (cycleTime >= 39.66 && cycleTime < 100) { 
                //     flowElement.classList.add('blue');
                // } else if (cycleTime === 0) { 
                    flowElement.classList.add('red');
                } else { 
                    flowElement.classList.add('grey');
                }
                
                totalTime += cycleTime;
            } else {
                flowElement.classList.add('grey'); 
            }
        } else {
            console.warn(`Elemento do fluxo para ${posto} não encontrado.`);
        }
    });
    const totalElement = processFlowElement.querySelector('p');
    totalElement.textContent = `Tempo total = ${totalTime.toFixed(2)}s`;
}


// * CRIAÇÃO DE DADOS FICTÍCIOS ANTES
// createBalanceChart(document.getElementById('balance').getContext('2d'), orders = [
//     { ordem: 'Geral', data: [12, 14, 16, 18, 20, 22, 24], color: '#005cb4' },
//     { ordem: 'Ordem 1', data: [10, 15, 20, 10, 5, 12, 8], color: '#007fc2' },
//     { ordem: 'Ordem 2', data: [5, 10, 15, 20, 25, 30, 35], color: '#198580' },
//     { ordem: 'Ordem 3', data: [20, 18, 16, 14, 12, 10, 8], color: '#00c9a5' },
//     { ordem: 'Ordem 4', data: [12, 14, 16, 18, 20, 22, 24], color: '#53aaff' },       
//     ],);

// * CRIAÇÃO DE DADOS FICTÍCIOS ANTES
// pcsMotor(document.getElementById('pcs').getContext('2d'))


// TODO: Criar gráficos de KPIs da linha de maneira dinâmica
// createGaugeChart(document.getElementById('gauge').getContext('2d'), data = [
//     { name: 'OEE GARGALO', value: 65, color: '#004A8F' },
//     { name: 'OEE', value: 65, color: '#004A8F' },
//     { name: 'ID', value: 85, color: '#4caf50' },
//     { name: 'IE', value: 91, color: '#ffc600' },
//     { name: 'IQ', value: 97, color: '#7f02c7' },
// ])

// TODO: Adicionar linha do tempo de operação ou não (como no dashboard)