
const postos = [
    { id: 1, status: "Operando", video: "http://10.1.60.155:4000/video_feed", tempo_padrao_medio: 0.39, tempo_real_medio: 0.41, qt_produzida: 23, tempo_ciclo: 0.87},
    { id: 2, status: "Operando", video: "http://10.1.60.183:4000/video_feed", tempo_padrao_medio: 0.45, tempo_real_medio: 0.44, qt_produzida: 20, tempo_ciclo: 1.12},
    { id: 3, status: "Sem conexão", video: "/videos/posto3.mp4", tempo_padrao_medio: 0, tempo_real_medio: 0, qt_produzida: 20, tempo_ciclo: 0},
    { id: 4, status: "Sem conexão", video: "/videos/posto4.mp4", tempo_padrao_medio: 0, tempo_real_medio: 0, qt_produzida: 20, tempo_ciclo: 0},
    { id: 5, status: "Sem conexão", video: "/videos/posto3.mp4", tempo_padrao_medio: 0, tempo_real_medio: 0, qt_produzida: 20, tempo_ciclo: 0},
    { id: 6, status: "Sem conexão", video: "/videos/posto3.mp4", tempo_padrao_medio: 0, tempo_real_medio: 0, qt_produzida: 20, tempo_ciclo: 0},
    { id: 7, status: "Sem conexão", video: "/videos/posto3.mp4", tempo_padrao_medio: 0, tempo_real_medio: 0, qt_produzida: 20, tempo_ciclo: 0}
];

const additionalInfo = document.getElementById('additional-info');

postos.forEach(posto => {
    const infoBox = document.createElement('div');
    infoBox.className = 'info-box';

    infoBox.innerHTML = `
    <header>
        <h2>Posto ${posto.id}</h2>
        <div class="status">${posto.status}</div>
    </header>
    ${posto.video.includes('http') 
            ? `<img src="${posto.video}" alt="Câmera ao Vivo">` 
            : `<video src="${posto.video}" controls></video>`}
            <div class="gauges">
                <div class="gauge"><canvas id="posto${posto.id}-oee"></canvas></div>
                <div class="gauge"><canvas id="posto${posto.id}-id"></canvas></div>
                <div class="gauge"><canvas id="posto${posto.id}-ie"></canvas></div>
                <div class="gauge"><canvas id="posto${posto.id}-iq"></canvas></div>
            </div>
            <p>Tempo padrão médio: <em>${posto.tempo_padrao_medio} min</em></p>
            <p>Tempo real médio: <em>${posto.tempo_real_medio} min</em></p>
            <p>Qtd. produzidas: <em>${posto.qt_produzida}</em>/ 100</p>
    `;
    
    additionalInfo.appendChild(infoBox);
});

/* <section class="process-flow">
            <div class="step green">0.62 min</div>
            <div class="step blue">1.12 min</div>
            <div class="step blue">1.35 min</div>
            <div class="step blue">1.37 min</div>
            <div class="step blue">1.09 min</div>
            <div class="step red">2.62 min</div>
            <div class="step blue">2.32 min</div>
            <p>Total = 2.94 min</p>
</section> */

const processFlowElem = document.getElementById('process-flow');

const tempos = postos.map(posto => posto.tempo_ciclo);
const menorTempo = Math.min(...tempos);
const maiorTempo = Math.max(...tempos);

postos.forEach(posto => {
    const step = document.createElement('div');

    if (posto.tempo_ciclo === menorTempo) {
        step.className = 'step green';
    } else if (posto.tempo_ciclo === maiorTempo) {
        step.className = 'step red';
    } else {
        step.className = 'step blue';
    }

    step.textContent = `${posto.tempo_ciclo} min`;

    processFlowElem.appendChild(step);
});

const totalTempo = tempos.reduce((total, tempo) => total + tempo, 0);

const totalElem = document.createElement('p');
totalElem.textContent = `Total = ${totalTempo.toFixed(2)} min`;
processFlowElem.appendChild(totalElem);

document.querySelectorAll('.info-box .status').forEach((status) => {
    if (status.textContent.trim() === "Parado" || status.textContent.trim() === "Sem conexão") {
        status.style.backgroundColor = "#F44336"; 
        status.style.color = "#fff"; 
    } else if (status.textContent.trim() === "Operando") {
        status.style.backgroundColor = "#4CAF50"; 
        status.style.color = "#fff"; 
    }
});