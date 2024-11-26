
const postos = [
    { id: 1, status: "Operando", video: "http://10.1.60.155:4000/video_feed", tempo_padrao_medio: 5, tempo_real_medio: 5, qt_produzida: 20, tempo_ciclo: 5},
    { id: 2, status: "Sem conexão", video: "http://10.1.60.183:4000/video_feed", tempo_padrao_medio: 5, tempo_real_medio: 5, qt_produzida: 20, tempo_ciclo: 5},
    { id: 3, status: "Sem conexão", video: "/videos/posto3.mp4", tempo_padrao_medio: 5, tempo_real_medio: 5, qt_produzida: 20, tempo_ciclo: 5},
    { id: 4, status: "Sem conexão", video: "/videos/posto4.mp4", tempo_padrao_medio: 5, tempo_real_medio: 5, qt_produzida: 20, tempo_ciclo: 5},
    { id: 5, status: "Sem conexão", video: "/videos/posto3.mp4", tempo_padrao_medio: 5, tempo_real_medio: 5, qt_produzida: 20, tempo_ciclo: 5},
    { id: 6, status: "Sem conexão", video: "/videos/posto3.mp4", tempo_padrao_medio: 5, tempo_real_medio: 5, qt_produzida: 20, tempo_ciclo: 5},
    { id: 7, status: "Sem conexão", video: "/videos/posto3.mp4", tempo_padrao_medio: 5, tempo_real_medio: 5, qt_produzida: 20, tempo_ciclo: 5}
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

postos.forEach(posto => {
    const processFlow = document.createElement('section');
    processFlow.className = 'process-flow';

    processFlow.innerHTML = `<div class="step blue">${posto.tempo_ciclo} min</div>`;
    
    additionalInfo.appendChild(processFlowElem);
})

document.querySelectorAll('.info-box .status').forEach((status) => {
    if (status.textContent.trim() === "Parado" || status.textContent.trim() === "Sem conexão") {
        status.style.backgroundColor = "#F44336"; 
        status.style.color = "#fff"; 
    } else if (status.textContent.trim() === "Operando") {
        status.style.backgroundColor = "#4CAF50"; 
        status.style.color = "#fff"; 
    }
});

