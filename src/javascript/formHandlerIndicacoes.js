document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        form: document.getElementById('whatsappForm'),
        steps: document.querySelectorAll('.form-step'),
        progressSteps: document.querySelectorAll('.progress-steps .step'),
        nextButton: document.querySelectorAll('.next-step'),
        prevButton: document.querySelectorAll('.prev-step')
    };

    const utils = {
        capitalize: str => str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase()),
        cleanNumber: str => str.replace(/[^\d]/g, ''),
    };

    const formHandlers = {
        validateStep1: () => ['nomeIndicado', 'telefoneIndicado']
            .every(id => document.getElementById(id)?.value.trim()),

        goToStep: (current, next) => {
            const direction = next > current ? ['slide-out', 'slide-in'] : ['slide-out-reverse', 'slide-in-reverse'];
            
            elements.progressSteps[current].classList.remove('active');
            elements.progressSteps[next].classList.add('active');
            elements.steps[current].classList.remove('active');
            elements.steps[next].classList.add('active');
            
            elements.steps[current].classList.add(direction[0]);
            elements.steps[next].classList.add(direction[1]);

            setTimeout(() => {
                elements.steps[current].classList.remove(direction[0]);
                elements.steps[next].classList.remove(direction[1]);
            }, 500);
        },

        showNotification: () => {
            const notification = Object.assign(document.createElement('div'), {
                className: 'notification',
                textContent: 'Formulário enviado com sucesso! Em breve retornaremos o contato.'
            });
            document.body.appendChild(notification);
            
            setTimeout(() => notification.classList.add('show'), 100);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        },

        getFormData: () => ({
            indicado: {
                nome: utils.capitalize(document.getElementById('nomeIndicado').value),
                telefone: utils.cleanNumber(document.getElementById('telefoneIndicado').value)
            },
            responsavel: {
                nome: utils.capitalize(document.getElementById('nomeResponsavel').value),
                telefone: utils.cleanNumber(document.getElementById('telefoneResponsavel').value),
                email: document.getElementById('emailResponsavel').value.toLowerCase(),
                pix: document.getElementById('pixResponsavel').value
            }
        })
    };

    const api = {
        token: '1741732478132-e4088e088f5e825c8e953333bda118d0',
        
        async sendMessage(formData) {
            const mensagem = `
                *Dados do Indicado:*
                Nome: ${formData.indicado.nome}
                Telefone: ${formData.indicado.telefone}

                *Dados do Responsável:*
                Nome: ${formData.responsavel.nome}
                Telefone: ${formData.responsavel.telefone}
                Email: ${formData.responsavel.email}
                Chave Pix: ${formData.responsavel.pix}
            `;

            const response = await fetch(`https://api-whatsapp.wascript.com.br/api/enviar-texto/${this.token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ phone: formData.indicado.telefone, message: mensagem })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Resposta da API:', errorData);
                throw new Error(`Erro ao enviar mensagem: ${errorData.message || response.statusText}`);
            }
            return response.json();
        },

        async addLabel(telefone) {
            try {
                const phoneFormatted = telefone.replace(/\D/g, '');
                
                const response = await fetch(`https://api-whatsapp.wascript.com.br/api/modificar-etiquetas/${this.token}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        phone: phoneFormatted,
                        actions: [{
                            labelId: 15,
                            type: 'add'
                        }]
                    })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao adicionar etiqueta');
                }

                return data;
            } catch (error) {
                console.error('Erro ao adicionar etiqueta:', error);
                throw error;
            }
        },

        async saveToSheet(formData) {
            const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyqJHxMjC3PyhC20dtfjFQ5_bYv0TBgT_yVYYu_OL08IIWKuwhj1yMPe-H0r9WIs408sQ/exec';
            
            try {
                const dataWithSheet = {
                    ...formData,
                    sheetName: 'Indicacao'
                };
                
                const response = await fetch(SHEET_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `data=${encodeURIComponent(JSON.stringify(dataWithSheet))}`,
                    mode: 'no-cors'
                });

                return { success: true, message: 'Dados enviados com sucesso' };
                
            } catch (error) {
                console.error('Erro ao salvar na planilha:', error);
                throw new Error('Erro ao salvar dados');
            }
        }
    };

    // Event Listeners
    elements.nextButton.forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = document.querySelector('.form-step.active');
            const stepNumber = parseInt(currentStep.classList[1].split('-')[1]);

            if (stepNumber === 1) {
                if (formHandlers.validateStep1()) {
                    formHandlers.goToStep(0, 1);
                } else {
                    alert('Por favor, preencha todos os campos do indicado.');
                }
            }
        });
    });

    elements.prevButton.forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = document.querySelector('.form-step.active');
            const stepNumber = parseInt(currentStep.classList[1].split('-')[1]);
            
            if (stepNumber === 2) {
                formHandlers.goToStep(1, 0);
            }
        });
    });

    elements.form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = formHandlers.getFormData();
            
            const promises = [];
            
            promises.push(
                api.sendMessage(formData).catch(error => {
                    console.error('Erro ao enviar mensagem WhatsApp:', error);
                })
            );
            
            promises.push(
                api.saveToSheet(formData)
            );
            
            promises.push(
                api.addLabel(formData.indicado.telefone).catch(error => {
                    console.error('Erro ao adicionar etiqueta:', error);
                })
            );

            await Promise.allSettled(promises);

            formHandlers.showNotification();
            elements.form.reset();
            formHandlers.goToStep(1, 0);
        } catch (error) {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao processar o formulário. Por favor, tente novamente.');
        }
    });

    // Máscaras de input
    $('#telefoneIndicado').mask('+55 (00) 0 0000-0000');
    $('#telefoneResponsavel').mask('+55 (00) 0 0000-0000');
});