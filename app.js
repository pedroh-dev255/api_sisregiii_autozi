const express = require('express');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const targetUrl = process.env.TARGET_URL;
const url2 = process.env.URL2;

const usuario = process.env.USER;
const senha = process.env.SENHA;

app.get('/scrape', async (req, res) => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // Inserir usuário e senha
        await page.type('input[name=usuario]', usuario);
        await page.type('input[name=senha]', senha);

        // Clicar no botão de login
        await page.evaluate(() => {
            document.querySelector('input[name=entrar].form-button').click();
        });
        await page.waitForNavigation({ waitUntil: 'networkidle2' });


        // Navegar para a nova URL após a autenticação
        await page.goto(url2, { waitUntil: 'networkidle2' });

         // Fazer o scraping do conteúdo desejado
         const data = await page.evaluate(() => {
            const tabela = document.querySelector('tbody.FichaCompleta:nth-child(6)');
            if (!tabela) {
                throw new Error('Tabela com a classe FichaCompleta não encontrada');
            }

            const getInnerText = (selector, defaultValue = '') => {
                const element = tabela.querySelector(selector);
                return element ? element.innerText : defaultValue;
            };

            const getTableCellText = (rowIndex, cellIndex, defaultValue = '') => {
                const row = tabela.querySelectorAll('tr')[rowIndex];
                if (row) {
                    const cell = row.querySelectorAll('td')[cellIndex];
                    return cell ? cell.innerText : defaultValue;
                }
                return defaultValue;
            };

            return {
                situacaoAtual: getTableCellText(1, 1),
            };
        });

        await browser.close();

        res.status(200).json({ data });
    } catch (error) {
        console.error('Erro durante o scraping:', error);
        res.status(500).json({ error: 'Erro durante o scraping' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});
