"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const openai_1 = require("openai");
const fs = require("fs");
const path = require("path");
class ChatGPTClient {
    constructor() {
        const configuration = new openai_1.Configuration({
            apiKey: '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',
        });
        this.openAI = new openai_1.OpenAIApi(configuration);
    }
    async respond(chatGPTMessages) {
        try {
            if (!chatGPTMessages) {
                return {
                    text: 'No chatGPT Messages',
                };
            }
            const request = {
                messages: chatGPTMessages,
                model: 'gpt-3.5-turbo',
            };
            const response = await this.openAI.createChatCompletion(request);
            if (!response.data || !response.data.choices) {
                return {
                    text: 'The bot did not respond. Please try again later.',
                };
            }
            return {
                text: response.data.choices[0].message?.content,
                messageId: response.data.id,
            };
        }
        catch (error) {
            console.log(error);
            throw new Error(String(error));
        }
    }
}
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    console.log('Congratulations, your extension is now active!');
    let disposable = vscode.commands.registerCommand('bunyan.generate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const text = document.getText();
            // read text from style.txt
            let styleText;
            try {
                styleText = fs.readFileSync(path.resolve(__dirname, 'style.txt'), 'utf8');
            }
            catch (error) {
                console.error(`Error reading style.txt: ${error}`);
                return;
            }
            let newText = '';
            // Start progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Processing your request",
                cancellable: false
            }, async (progress, token) => {
                progress.report({ increment: 0 });
                const chatGPTClient = new ChatGPTClient();
                const chatGPTMessage = {
                    role: 'user',
                    content: text,
                };
                const instructionMessage = {
                    role: 'assistant',
                    content: 'Make changes only when necessary. Respond with only code, no natural language.'
                };
                const chatGPTMessage2 = {
                    role: 'user',
                    content: `Given contents of a code and the style guide file, return the revised code following style guide: ${styleText}. Only code response`
                };
                const chatGPTRequest = {
                    model: 'gpt-4-32k',
                    messages: [instructionMessage, chatGPTMessage, chatGPTMessage2],
                };
                progress.report({ increment: 50 });
                await chatGPTClient
                    .respond([chatGPTMessage])
                    .then(response => {
                    console.log("response", response);
                    if (!response.text) {
                        newText = 'The bot did not respond. Please try again later.';
                        return;
                    }
                    newText = response.text;
                })
                    .catch(error => {
                    console.log(error);
                    newText = 'The bot did not respond. Please try again later.';
                });
                editor.edit(editBuilder => {
                    const range = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
                    editBuilder.replace(range, newText);
                });
                progress.report({ increment: 100 });
            });
        }
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map