document.addEventListener('DOMContentLoaded', () => {
    // --- Local Storage Key ---
    const STORAGE_KEY_CHECKED_ITEMS = 'checkedShoppingListItems';

    // --- Elementos Comuns (Ambas as Páginas) ---
    const cardapioGrid = document.getElementById('cardapio-grid');
    const receitasLista = document.getElementById('receitas-lista');
    const comprasLista = document.getElementById('compras-lista');
    const historicoLista = document.getElementById('historico-lista'); // Elemento do Histórico
    const historicoStatus = document.getElementById('historico-status'); // Mensagens na página Histórico
    const dayFilter = document.getElementById('day-filter');
    const btnClearCompras = document.getElementById('btn-clear-compras');
    
    // --- Elementos da Página de Receitas ---
    const msgStatusReceita = document.getElementById('msg-status-receita'); // Status de Adição/Remoção
    const formAddReceita = document.getElementById('form-add-receita');
    const formEdicaoSection = document.getElementById('form-receita-edicao'); // Seção do formulário de edição
    const formEditReceita = document.getElementById('form-edit-receita'); // Formulário de edição
    const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');


    // ==========================================================
    // FUNÇÕES DE FETCH (API)
    // ==========================================================

    async function fetchReceitas() {
        try {
            const response = await fetch('/api/receitas');
            if (!response.ok) throw new Error('Erro ao buscar receitas.');
            return await response.json();
        } catch (error) {
            console.error('Erro em fetchReceitas:', error);
            return [];
        }
    }

    async function fetchCardapio() {
        try {
            const response = await fetch('/api/cardapio');
            if (!response.ok) throw new Error('Erro ao buscar cardápio.');
            return await response.json();
        } catch (error) {
            console.error('Erro em fetchCardapio:', error);
            return [];
        }
    }
    
    // Busca o histórico semanal
    async function fetchHistorico() {
        try {
            const response = await fetch('/api/historico');
            if (!response.ok) throw new Error('Erro ao buscar histórico.');
            return await response.json();
        } catch (error) {
            console.error('Erro em fetchHistorico:', error);
            return [];
        }
    }

    // ==========================================================
    // FUNÇÕES DE ESTADO LOCAL (LocalStorage para Compras)
    // ==========================================================

    function getCheckedItems() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_CHECKED_ITEMS);
            // Retorna o objeto de itens marcados ou um objeto vazio
            return stored ? JSON.parse(stored) : {}; 
        } catch (e) {
            console.error("Erro ao recuperar checked items do LocalStorage:", e);
            return {};
        }
    }

    function updateCheckedItem(itemKey, isChecked) {
        const checkedItems = getCheckedItems();
        if (isChecked) {
            checkedItems[itemKey] = true;
        } else {
            delete checkedItems[itemKey];
        }
        localStorage.setItem(STORAGE_KEY_CHECKED_ITEMS, JSON.stringify(checkedItems));
    }

    function clearCheckedItems() {
        localStorage.removeItem(STORAGE_KEY_CHECKED_ITEMS);
        renderListaCompras(); // Re-renderiza a lista para refletir a limpeza
    }
    
    // ==========================================================
    // FUNÇÕES DE AÇÃO (POST/PUT/DELETE)
    // ==========================================================

    // Adiciona uma nova receita (POST)
    async function addReceita(nome, ingredientes, descricao) {
        try {
            const response = await fetch('/api/receitas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, ingredientes, descricao })
            });
            if (!response.ok) throw new Error('Erro ao adicionar receita.');
            const data = await response.json();
            msgStatusReceita.textContent = `Receita "${data.nome}" (ID: ${data.id}) adicionada!`;
            msgStatusReceita.style.color = 'green';
            renderReceitas(); 
            // Não é necessário renderizar cardápio/compras aqui, pois esta é a página de receitas
            if (formAddReceita) formAddReceita.reset();
        } catch (error) {
            msgStatusReceita.textContent = `Erro: ${error.message}`;
            msgStatusReceita.style.color = 'red';
            console.error('Erro em addReceita:', error);
        }
    }
    
    // Deleta uma receita (DELETE)
    async function deleteReceita(id) {
        try {
            const response = await fetch(`/api/receitas/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erro ao remover receita.');
            await response.json();
            msgStatusReceita.textContent = `Receita (ID: ${id}) removida!`;
            msgStatusReceita.style.color = 'green';
            renderReceitas();
            // Avisa o usuário para verificar as outras páginas, se necessário.
        } catch (error) {
            msgStatusReceita.textContent = `Erro ao remover receita: ${error.message}`;
            msgStatusReceita.style.color = 'red';
            console.error('Erro em deleteReceita:', error);
        }
    }

    // Atualiza uma receita existente (PUT)
    async function updateReceita(id, nome, ingredientes, descricao) {
        try {
            const response = await fetch(`/api/receitas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, ingredientes, descricao })
            });

            if (!response.ok) {
                try {
                    const errorJson = await response.json();
                    throw new Error(errorJson.error || errorJson.message || `Erro do servidor (Status ${response.status}): ${response.statusText}`);
                } catch (e) {
                    throw new Error(`Falha de comunicação com a API (PUT). Verifique a rota '/api/receitas/${id}'. Status: ${response.status}`);
                }
            }
            
            const result = await response.json();
            
            document.getElementById('msg-status-edicao').textContent = `Sucesso! ${result.message}`;
            document.getElementById('msg-status-edicao').style.color = 'green';
            
            hideEditForm(); 
            renderReceitas(); 
        } catch (error) {
            document.getElementById('msg-status-edicao').textContent = `Erro: ${error.message}`;
            document.getElementById('msg-status-edicao').style.color = 'red';
            console.error('Erro em updateReceita:', error);
        }
    }

    // Atualiza o cardápio para um dia específico (POST)
    async function updateCardapioDia(dia, receita_id) {
        try {
            const response = await fetch('/api/cardapio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dia, receita_id })
            });
            if (!response.ok) throw new Error('Erro ao atualizar cardápio.');
            await response.json();
            console.log(`Cardápio para ${dia} atualizado e histórico salvo.`);
            
            // Só renderiza lista de compras se estiver na página index
            if (comprasLista) renderListaCompras(); 
        } catch (error) {
            console.error('Erro em updateCardapioDia:', error);
            // Retorna false em caso de erro para a função repeatWeek saber
            return false; 
        }
        return true;
    }
    
    // NOVO: Repete uma semana inteira do histórico
    async function repeatWeek(historicalDays, semana_inicio) {
        if (!window.confirm(`Tem certeza que deseja REPETIR o cardápio da semana de ${formatarData(semana_inicio)}? Isso substituirá suas escolhas atuais.`)) {
            return;
        }

        historicoStatus.textContent = 'Repetindo semana... Aguarde.';
        historicoStatus.classList.remove('text-red-600', 'text-green-600');
        historicoStatus.classList.add('text-indigo-600');
        
        let successCount = 0;
        let failCount = 0;
        const diasOrdenados = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

        for (const dia of diasOrdenados) {
            const receita = historicalDays[dia];
            if (receita) {
                const receita_id = receita.id;
                const success = await updateCardapioDia(dia, receita_id);
                if (success) {
                    successCount++;
                } else {
                    failCount++;
                }
            } else {
                // Se não tinha receita no histórico, limpamos o dia na semana atual.
                 const success = await updateCardapioDia(dia, null);
                 if (success) {
                    successCount++;
                 } else {
                    failCount++;
                 }
            }
        }
        
        if (failCount === 0) {
            historicoStatus.textContent = `Cardápio da semana de ${formatarData(semana_inicio)} REPETIDO com sucesso! Você pode verificar no "Cardápio Atual".`;
            historicoStatus.classList.remove('text-indigo-600');
            historicoStatus.classList.add('text-green-600');
        } else {
            historicoStatus.textContent = `Erro ao repetir semana. ${failCount} dia(s) falharam ao ser atualizados.`;
            historicoStatus.classList.remove('text-indigo-600');
            historicoStatus.classList.add('text-red-600');
        }
        
        // Re-renderiza o histórico para limpar o status, se for o caso
        renderHistorico(); 
    }

    // ==========================================================
    // FUNÇÕES DE INTERFACE (Renderização)
    // ==========================================================

    function hideEditForm() {
        if (formEdicaoSection) {
            formEdicaoSection.classList.add('hidden');
            formEditReceita.reset();
             document.getElementById('msg-status-edicao').textContent = ''; // Limpa a mensagem
        }
    }

    function showEditForm(receita) {
        if (!formEdicaoSection) return;
        
        // Preenche o formulário
        document.getElementById('edit-id-receita').value = receita.id;
        document.getElementById('edit-nome-receita').value = receita.nome;
        document.getElementById('edit-ingredientes-receita').value = receita.ingredientes;
        document.getElementById('edit-descricao-receita').value = receita.descricao || '';
        document.getElementById('edit-recipe-id-display').textContent = `(ID: ${receita.id})`;
        
        // Exibe o formulário
        formEdicaoSection.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo
    }


    async function renderReceitas() {
        if (!receitasLista) return; 
        // ... (renderReceitas logic remains the same for receitas.html)
        receitasLista.innerHTML = '<p>Carregando receitas...</p>';
        const receitas = await fetchReceitas();

        if (receitas.length === 0) {
            receitasLista.innerHTML = '<p>Nenhuma receita cadastrada ainda.</p>';
            return;
        }

        receitasLista.innerHTML = '';
        receitas.forEach(receita => {
            const div = document.createElement('div');
            div.classList.add('receita-item', 'bg-white', 'p-4', 'rounded-lg', 'shadow', 'flex', 'justify-between', 'items-start', 'mb-3', 'border', 'border-gray-200');
            
            const actionContainer = document.createElement('div');
            actionContainer.classList.add('receita-actions', 'flex', 'flex-col', 'gap-2', 'ml-4', 'mt-1');

            // Botão EDITAR
            const btnEdit = document.createElement('button');
            btnEdit.textContent = 'Editar';
            btnEdit.classList.add('btn-primary', 'text-sm', 'bg-indigo-500', 'hover:bg-indigo-600'); 
            btnEdit.addEventListener('click', () => showEditForm(receita));
            actionContainer.appendChild(btnEdit);
            
            // Botão REMOVER
            const btnDelete = document.createElement('button');
            btnDelete.textContent = 'Remover';
            btnDelete.classList.add('btn-secondary', 'text-sm', 'bg-red-500', 'hover:bg-red-600', 'text-white'); 
            btnDelete.addEventListener('click', async () => {
                if (window.confirm(`Tem certeza que deseja remover "${receita.nome}" (ID: ${receita.id})?`)) { 
                    await deleteReceita(receita.id);
                }
            });
            actionContainer.appendChild(btnDelete);


            div.innerHTML = `
                <div class="flex-grow">
                    <h3 class="text-xl font-semibold text-gray-800">${receita.nome} <span class="text-gray-400 text-sm">(ID: ${receita.id})</span></h3>
                    <p class="mt-2 text-gray-600"><strong>Ingredientes:</strong> ${receita.ingredientes.split('\n').join(', ')}</p>
                    ${receita.descricao ? `<p class="text-gray-500 italic mt-1"><strong>Descrição:</strong> ${receita.descricao}</p>` : ''}
                </div>
            `;
            div.appendChild(actionContainer); 
            receitasLista.appendChild(div);
        });
    }

    async function renderCardapio() {
        if (!cardapioGrid) return; 
        cardapioGrid.innerHTML = '<p>Carregando cardápio...</p>';
        const cardapioData = await fetchCardapio();
        const todasReceitas = await fetchReceitas();

        if (cardapioData.length === 0) {
            cardapioGrid.innerHTML = '<p>Nenhum dia configurado no cardápio.</p>';
            return;
        }

        cardapioGrid.innerHTML = '';
        cardapioData.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('cardapio-dia');
            
            const select = document.createElement('select');
            select.dataset.dia = item.dia; 
            select.innerHTML = `<option value="">--- Selecionar Receita ---</option>`;
            
            todasReceitas.forEach(receita => {
                const option = document.createElement('option');
                option.value = receita.id;
                option.textContent = receita.nome;
                if (item.receita_id === receita.id) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            select.addEventListener('change', async (e) => {
                const dia = e.target.dataset.dia;
                const receita_id = e.target.value || null; 
                await updateCardapioDia(dia, receita_id);
            });

            div.innerHTML = `<h3>${item.dia}</h3>`;
            div.appendChild(select);
            cardapioGrid.appendChild(div);
        });
    }
    
    // Renderiza a lista de compras (Lógica de Filtro e Estado Local)
    async function renderListaCompras() {
        if (!comprasLista) return; 
        // ... (renderListaCompras logic remains the same for index.html)
        comprasLista.innerHTML = '<p>Gerando lista de compras...</p>';
        
        const cardapioData = await fetchCardapio();
        
        // Mapeia ingrediente -> { name, days: Set<day> }
        const allIngredients = new Map(); 
        
        if (dayFilter) {
            let selectedDay = dayFilter.value;
            dayFilter.innerHTML = '<option value="all">Toda a Semana</option>';

            cardapioData.forEach(item => {
                if (item.receita_id) {
                    if (!dayFilter.querySelector(`option[value="${item.dia}"]`)) {
                        const option = document.createElement('option');
                        option.value = item.dia;
                        option.textContent = item.dia;
                        dayFilter.appendChild(option);
                    }

                    const ingredientesArray = item.ingredientes ? item.ingredientes.split('\n')
                        .map(ing => ing.trim())
                        .filter(ing => ing) : [];
                    
                    ingredientesArray.forEach(ing => {
                        const key = ing.toLowerCase();
                        if (!allIngredients.has(key)) {
                            allIngredients.set(key, { name: ing, days: new Set() });
                        }
                        allIngredients.get(key).days.add(item.dia);
                    });
                }
            });
            
            if (dayFilter.querySelector(`option[value="${selectedDay}"]`)) {
                 dayFilter.value = selectedDay;
            } else {
                 dayFilter.value = 'all';
            }
        }

        const checkedItems = getCheckedItems();
        const currentFilter = dayFilter ? dayFilter.value : 'all';
        
        const sortedIngredients = Array.from(allIngredients.values())
            .filter(item => {
                if (currentFilter === 'all') return true;
                return item.days.has(currentFilter);
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        if (sortedIngredients.length === 0) {
            comprasLista.innerHTML = `<p>Nenhum item de compra gerado para ${currentFilter === 'all' ? 'esta semana' : currentFilter}.</p>`;
            return;
        }

        comprasLista.innerHTML = '';
        const ul = document.createElement('ul');
        
        sortedIngredients.forEach(item => {
            const itemKey = item.name.toLowerCase(); 
            const isChecked = checkedItems[itemKey] || false;
            
            const li = document.createElement('li');
            li.classList.add('compra-item');
            if (isChecked) {
                li.classList.add('checked');
            }
            
            const daysUsed = Array.from(item.days).join(', ');
            
            li.innerHTML = `
                <input type="checkbox" id="item-${itemKey.replace(/\s/g, '-')}" data-key="${itemKey}" ${isChecked ? 'checked' : ''}>
                <label for="item-${itemKey.replace(/\s/g, '-')}" title="Necessário para: ${daysUsed}">${item.name}</label>
                <span class="day-hint" title="Dias em que este item é necessário">${daysUsed}</span>
            `;
            
            const checkbox = li.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                const checked = e.target.checked;
                updateCheckedItem(key, checked);
                li.classList.toggle('checked', checked);
            });
            
            ul.appendChild(li);
        });
        
        comprasLista.appendChild(ul);
    }

    // Renderiza a seção de histórico (AGORA NA PÁGINA DEDICADA)
    async function renderHistorico() {
        if (!historicoLista) return;
        historicoLista.innerHTML = '<p>Carregando histórico de cardápios...</p>';

        const historicoData = await fetchHistorico();
        if (historicoData.length === 0) {
            historicoLista.innerHTML = '<p>Nenhum cardápio semanal foi registrado ainda.</p>';
            return;
        }

        historicoLista.innerHTML = '';
        
        // Loop por cada semana salva
        historicoData.forEach(semana => {
            const divSemana = document.createElement('div');
            divSemana.classList.add('historico-semana');

            const semanaText = formatarData(semana.semana);

            // Botão Repetir Semana
            const btnRepeat = document.createElement('button');
            btnRepeat.textContent = '🔁 Repetir Semana';
            btnRepeat.classList.add('btn-success', 'w-full', 'sm:w-auto', 'self-end');
            btnRepeat.addEventListener('click', () => repeatWeek(semana.dias, semana.semana));


            divSemana.innerHTML = `
                <div class="flex justify-between items-center flex-wrap gap-2">
                    <h4 class="text-xl">Semana de ${semanaText}</h4>
                    <!-- O botão será inserido abaixo -->
                </div>
                <div class="historico-dias-grid" id="semana-${semana.semana}">
                </div>
            `;
            
            divSemana.querySelector('.flex').appendChild(btnRepeat);

            const diasGrid = divSemana.querySelector('.historico-dias-grid');
            const diasOrdenados = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
            
            diasOrdenados.forEach(dia => {
                const receita = semana.dias[dia];
                const divDia = document.createElement('div');
                divDia.classList.add('historico-dia-item');
                divDia.innerHTML = `
                    <strong>${dia}:</strong>
                    <span>${receita && receita.nome ? receita.nome : 'N/A'}</span>
                `;
                diasGrid.appendChild(divDia);
            });

            historicoLista.appendChild(divSemana);
        });
    }
    
    // Função auxiliar para formatar a data (YYYY-MM-DD para DD/MM/YYYY)
    function formatarData(dataISO) {
        if (!dataISO) return '';
        const parts = dataISO.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }


    // ==========================================================
    // INICIALIZAÇÃO E LISTENERS
    // ==========================================================
    
    // Página principal (index.html)
    if (cardapioGrid) {
        renderCardapio();
        renderListaCompras(); 

        if (dayFilter) {
            dayFilter.addEventListener('change', renderListaCompras); 
        }
        if (btnClearCompras) {
            btnClearCompras.addEventListener('click', () => {
                 if (window.confirm("Tem certeza que deseja limpar a marcação de todos os itens comprados?")) { 
                     clearCheckedItems();
                 }
            });
        }

        document.getElementById('btn-atualizar-cardapio').addEventListener('click', () => {
             renderCardapio(); 
             renderListaCompras();
        });
        document.getElementById('btn-gerar-compras').addEventListener('click', renderListaCompras);
    } 
    // Página de histórico (historico.html)
    else if (historicoLista) {
        renderHistorico();
    }
    // Página de receitas (receitas.html)
    else if (formAddReceita) {
        renderReceitas();
        hideEditForm();
        
        // Listener para o formulário de ADIÇÃO
        formAddReceita.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome-receita').value;
            const ingredientes = document.getElementById('ingredientes-receita').value;
            const descricao = document.getElementById('descricao-receita').value;
            await addReceita(nome, ingredientes, descricao);
        });

        // Listener para o formulário de EDIÇÃO (PUT)
        formEditReceita.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-id-receita').value;
            const nome = document.getElementById('edit-nome-receita').value;
            const ingredientes = document.getElementById('edit-ingredientes-receita').value;
            const descricao = document.getElementById('edit-descricao-receita').value;
            await updateReceita(id, nome, ingredientes, descricao);
        });

        // Listener para o botão CANCELAR EDIÇÃO
        if (btnCancelarEdicao) {
            btnCancelarEdicao.addEventListener('click', hideEditForm);
        }
    }
});
