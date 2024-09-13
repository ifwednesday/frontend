document.addEventListener("DOMContentLoaded", function () {
    const allButtons = document.querySelectorAll("button");
    const submitButton = document.getElementById("submit-btn");
    const viewReportsButton = document.getElementById("view-reports-btn");
    const confirmButton = document.getElementById("confirm-btn");
    const cancelButton = document.getElementById("cancel-btn");
    const modal = document.getElementById("confirmation-modal");
    const requiredFields = document.querySelectorAll("[required]");
    const successMessage = document.getElementById("success-message");
    const closeSuccessButton = document.getElementById("close-success-btn");
    const viewReportsModal = document.getElementById("view-reports-modal");
    const submitReportCodeButton = document.getElementById("submit-report-code-btn");
    const reportDetails = document.getElementById("report-details");
    const pdfViewer = document.getElementById("pdf-viewer");
    const closeViewReportsButton = document.getElementById("close-view-reports-btn");
    const confirmationText = document.getElementById("confirmation-text");
    const form = document.querySelector("form");
    const body = document.body;
    let signatureImage = null;
    let filesReady = false;
    let isDevMode = false;

    // Gerenciamento de arquivos
    const comprovantesInput = document.getElementById('comprovantes');
    const fileChosen = document.getElementById('file-chosen');
    const addMoreFilesBtn = document.getElementById('add-more-files-btn');
    const fileList = document.getElementById('file-list');
    let filesArray = [];

    // Função para atualizar a exibição de arquivos anexados
    function updateFileList() {
        fileList.innerHTML = ''; // Limpa a lista antes de atualizar
        filesArray.forEach((file, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${file.name}`;
            fileList.appendChild(listItem);
        });
        fileChosen.textContent = `${filesArray.length} arquivo(s) selecionado(s)`;
    }

    // Evento para o primeiro input de arquivos
    comprovantesInput.addEventListener('change', function () {
        for (let i = 0; i < comprovantesInput.files.length; i++) {
            filesArray.push(comprovantesInput.files[i]);
        }
        updateFileList();
        checkSubmitReady(); // Atualiza a validação
    });

    // Evento para adicionar mais arquivos
    addMoreFilesBtn.addEventListener('click', function () {
        const newInput = document.createElement('input');
        newInput.type = 'file';
        newInput.multiple = true;
        newInput.accept = '.pdf, .jpg, .jpeg, .png,';

        newInput.addEventListener('change', function () {
            for (let i = 0; i < newInput.files.length; i++) {
                filesArray.push(newInput.files[i]);
            }
            updateFileList();
            checkSubmitReady(); // Atualiza a validação
        });

        newInput.click();
    });

    // Função para verificar se a assinatura e arquivos estão prontos para envio
    function checkSubmitReady() {
        if (signatureImage && filesArray.length > 0) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    }

    // Elementos da assinatura
    const signatureButton = document.getElementById("signature-btn");
    const signatureModal = document.getElementById("signature-modal");
    const signatureStatus = document.getElementById("signature-status");
    const signaturePadElement = document.getElementById("signature-pad");
    const clearSignatureButton = document.getElementById("clear-signature-btn");
    const saveSignatureButton = document.getElementById("save-signature-btn");

    // Verifica se está em modo desenvolvedor (localhost)
    if (window.location.hostname === 'localhost' && window.location.port === '3000') {
        isDevMode = true;
        console.log("Modo desenvolvedor ativado: validações desativadas.");
    }

    // Log de todos os botões clicados
    allButtons.forEach(button => {
        button.addEventListener("click", function (event) {
            console.log(`Botão clicado: ${event.target.id || event.target.textContent}`);
        });
    });

    // Inicializar o Signature Pad
    let signaturePad = null;

    function initializeSignaturePad() {
        signaturePad = new SignaturePad(signaturePadElement, {
            backgroundColor: 'rgba(255, 255, 255, 1)',
            penColor: 'black'
        });
        adjustCanvasSize();
    }

    function adjustCanvasSize() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        signaturePadElement.width = signaturePadElement.offsetWidth * ratio;
        signaturePadElement.height = signaturePadElement.offsetHeight * ratio;
        const ctx = signaturePadElement.getContext("2d");
        ctx.scale(ratio, ratio);
        signaturePad.clear();
    }

    // Exibir modal de assinatura
    signatureButton.addEventListener("click", function () {
        toggleModal(signatureModal, true);
        initializeSignaturePad();
    });

    // Limpar a assinatura
    clearSignatureButton.addEventListener("click", function () {
        signaturePad.clear();
    });

    // Salvar a assinatura
    saveSignatureButton.addEventListener("click", function () {
        if (!signaturePad.isEmpty()) {
            signatureImage = signaturePad.toDataURL();
            signatureStatus.textContent = "Documento assinado";
            signatureStatus.classList.remove("signature-not-signed");
            signatureStatus.classList.add("signature-signed");
            toggleModal(signatureModal, false);
            checkSubmitReady();
        } else {
            alert("Por favor, assine antes de salvar.");
        }
    });

    // Atualizar data e hora
    function updateDateTime() {
        const currentTimeElement = document.getElementById("current-time");
        if (currentTimeElement) {
            const now = new Date();
            const formattedDateTime = formatDateTime(now);
            currentTimeElement.textContent = formattedDateTime;
        }
    }

    function formatDateTime(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Função genérica para abrir/fechar modais
    function toggleModal(modalElement, isOpen) {
        if (isOpen) {
            modalElement.style.display = "flex";
            modalElement.scrollIntoView({ behavior: "smooth", block: "center" });
            body.classList.add('modal-open');
        } else {
            modalElement.style.display = "none";
            body.classList.remove('modal-open');
        }
    }

    // Função de validação dos campos do formulário
    function validateForm() {
        let isValid = true;
        let invalidFields = [];

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add("error-border");
                invalidFields.push(field);
            } else {
                field.classList.remove("error-border");
            }
        });

        if (invalidFields.length > 0) {
            invalidFields[0].scrollIntoView({ behavior: "smooth" });
        }

        return isValid;
    }

    // Ação ao enviar relatório
    submitButton.addEventListener("click", function () {
        if (!signatureImage && !isDevMode) {
            alert("Assinatura faltando. Por favor, assine o documento.");
        } else if (filesArray.length === 0 && !isDevMode) {
            alert("Comprovantes faltando. Por favor, anexe os arquivos.");
        } else if (validateForm() || isDevMode) {
            toggleModal(modal, true);
        }
    });

    // Confirmar envio de relatório
    confirmButton.addEventListener("click", function () {
        toggleModal(modal, false);
        alert("Relatório confirmado (simulação, não há envio de dados)");
    });

    cancelButton.addEventListener("click", function () {
        toggleModal(modal, false);
    });

    closeSuccessButton.addEventListener("click", function () {
        toggleModal(successMessage, false);
    });

    viewReportsButton.addEventListener("click", function () {
        alert("Simulação de visualização de relatórios.");
        toggleModal(viewReportsModal, true);
    });

    closeViewReportsButton.addEventListener("click", function () {
        toggleModal(viewReportsModal, false);
    });

    submitReportCodeButton.addEventListener("click", function () {
        const code = document.getElementById("report-code-input").value.toUpperCase();
        if (code in reports) {
            const report = reports[code];
            reportDetails.innerHTML = `
                <p><strong>SECRETARIA MUNICIPAL DE FINANÇAS</strong></p>
                <p><strong>RECEBIMENTO</strong></p>
                <p><strong>Código:</strong> ${code}</p>
                <p><strong>Nome:</strong> ${report.nome}</p>
                <p><strong>Matricula/Portaria:</strong> ${report.matricula}</p>
                <p><strong>Envio:</strong> ${report.dataEnvio}</p>
                <img src="${report.signature}" alt="Assinatura" />
            `;

            // Exibir anexos
            if (report.files && report.files.length > 0) {
                const fileList = document.createElement('ul');
                fileList.style.listStyleType = 'none';  // Estilo da lista sem marcadores
                fileList.innerHTML = '<p><strong>Anexos:</strong></p>';
                
                report.files.forEach((file, index) => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<a href="${file.url}" target="_blank">Anexo ${index + 1}: ${file.name}</a>`;
                    fileList.appendChild(listItem);
                });

                reportDetails.appendChild(fileList);
            }

            if (report.pdfURL) {
                pdfViewer.src = report.pdfURL;
                pdfViewer.style.display = "block";
            } else {
                pdfViewer.style.display = "none";
            }
        } else {
            reportDetails.innerHTML = "<p>Relatório não encontrado.</p>";
            pdfViewer.style.display = "none";
        }
    });

    // Abrir modal de Termos de Uso
    const openTermsBtn = document.getElementById('open-terms-btn');
    const termsModal = document.getElementById('terms-modal');
    const closeTermsBtn = document.getElementById('close-terms-btn');

    openTermsBtn.addEventListener('click', function () {
        toggleModal(termsModal, true);
    });

    closeTermsBtn.addEventListener('click', function () {
        toggleModal(termsModal, false);
    });

    window.addEventListener('click', function (event) {
        if (event.target === termsModal) {
            toggleModal(termsModal, false);
        }
    });

    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && termsModal.style.display === 'flex') {
            toggleModal(termsModal, false);
        }
    });

    

});
