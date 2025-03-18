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
        validateCPF: cpf => {
            cpf = cpf.replace(/[^\d]/g, '');
            if (cpf.length !== 11 || /^(.)\1+$/.test(cpf)) return false;
            
            return [9, 10].every(n => {
                let sum = 0;
                for (let i = 0; i < n; i++) sum += parseInt(cpf[i]) * ((n + 1) - i);
                const digit = (sum * 10) % 11 % 10;
                return digit === parseInt(cpf[n]);
            });
        }
    };

    const formHandlers = {
        validateStep1: () => ['placa', 'tipoVeiculo', 'usoVeiculo', 'pernoite']
            .every(id => document.getElementById(id)?.value.trim()),

        validateStep2: () => ['nome', 'cpf', 'telefone', 'email', 'cep']
            .every(id => document.getElementById(id)?.value.trim()),

        validateStep3: () => ['nomeLoja', 'nomeVendedor', 'telefoneVendedor']
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
            veiculo: {
                placa: document.getElementById('placa').value.toUpperCase(),
                tipo: utils.capitalize(document.getElementById('tipoVeiculo').value),
                uso: utils.capitalize(document.getElementById('usoVeiculo').value),
                pernoite: utils.capitalize(document.getElementById('pernoite').value)
            },
            cliente: {
                nome: utils.capitalize(document.getElementById('nome').value),
                cpf: utils.cleanNumber(document.getElementById('cpf').value),
                telefone: utils.cleanNumber(document.getElementById('telefone').value),
                email: document.getElementById('email').value.toLowerCase(),
                cep: utils.cleanNumber(document.getElementById('cep').value)
            },
            loja: {
                nome: utils.capitalize(document.getElementById('nomeLoja').value),
                vendedor: utils.capitalize(document.getElementById('nomeVendedor').value),
                telefoneVendedor: utils.cleanNumber(document.getElementById('telefoneVendedor').value)
            }
        })
    };

    const api = {
        token: '1741732478132-e4088e088f5e825c8e953333bda118d0',
        
        async sendMessage(formData) {
            const mensagem = `
                *Dados do Veículo:*
                Placa: ${formData.veiculo.placa}
                Tipo: ${formData.veiculo.tipo}
                Uso: ${formData.veiculo.uso}
                Pernoite: ${formData.veiculo.pernoite}

                *Dados do Cliente:*
                Nome: ${formData.cliente.nome}
                CPF: ${formData.cliente.cpf}
                Email: ${formData.cliente.email}
                CEP: ${formData.cliente.cep}

                *Dados da Loja:*
                Loja: ${formData.loja.nome}
                Vendedor: ${formData.loja.vendedor}
                Telefone Vendedor: ${formData.loja.telefoneVendedor}
            `;

            const response = await fetch(`https://api-whatsapp.wascript.com.br/api/enviar-texto/${this.token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ phone: formData.cliente.telefone, message: mensagem })
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
                            labelId: 14,
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
                    sheetName: 'Loja',
                    veiculo: formData.veiculo,
                    cliente: formData.cliente,
                    loja: {
                        nome: formData.loja.nome,
                        vendedor: formData.loja.vendedor,
                        telefoneVendedor: formData.loja.telefoneVendedor
                    }
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

    elements.nextButton.forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = document.querySelector('.form-step.active');
            const stepNumber = parseInt(currentStep.classList[1].split('-')[1]);

            switch(stepNumber) {
                case 1:
                    if (formHandlers.validateStep1()) {
                        formHandlers.goToStep(0, 1);
                    } else {
                        alert('Por favor, preencha todos os campos do veículo.');
                    }
                    break;
                case 2:
                    if (formHandlers.validateStep2()) {
                        formHandlers.goToStep(1, 2);
                    } else {
                        alert('Por favor, preencha todos os campos pessoais.');
                    }
                    break;
                case 3:
                    if (formHandlers.validateStep3()) {
                        elements.form.requestSubmit();
                    } else {
                        alert('Por favor, preencha todos os campos da loja.');
                    }
                    break;
            }
        });
    });

    elements.prevButton.forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = document.querySelector('.form-step.active');
            const stepNumber = parseInt(currentStep.classList[1].split('-')[1]);
            
            if (stepNumber === 2) {
                formHandlers.goToStep(1, 0);
            } else if (stepNumber === 3) {
                formHandlers.goToStep(2, 1);
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
                api.addLabel(formData.cliente.telefone).catch(error => {
                    console.error('Erro ao adicionar etiqueta:', error);
                })
            );

            await Promise.allSettled(promises);

            formHandlers.showNotification();
            elements.form.reset();
            
            elements.progressSteps.forEach((step, index) => {
                if (index === 0) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });
            
            formHandlers.goToStep(2, 0);
            
        } catch (error) {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao processar o formulário. Por favor, tente novamente.');
        }
    });

    // Máscaras de input
    $('#placa').mask('AAA-0B00', {
        translation: {
            'A': { pattern: /[A-Za-z]/ },
            'B': { pattern: /[A-Za-z0-9]/ }
        }
    }).on('input', function() {
        let value = $(this).val().toUpperCase();
        $(this).val(value.replace(/[^A-Z0-9-]/g, ''));
        
        if (value.length >= 3 && !/^[A-Z]{3}/.test(value.substring(0, 3))) {
            $(this).val('');
        }
    });

    $('#cpf').mask('000.000.000-00');
    $('#telefone').mask('+55 (00) 0 0000-0000');
    $('#cep').mask('00000-000');

    $('#whatsappForm').on('submit', function(e) {
        if (!utils.validateCPF($('#cpf').val())) {
            e.preventDefault();
            alert('Por favor, insira um CPF válido.');
            return false;
        }
    });

    // Máscaras de input adicionais
    $('#telefoneVendedor').mask('+55 (00) 0 0000-0000');
});