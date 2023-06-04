"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const openai_1 = require("openai");
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
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('bunyan.generate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const text = document.getText();
            // console.log(text);
            // Insert a random character every two lines
            let newText = '';
            //Make call to gpt-4 
            const chatGPTClient = new ChatGPTClient();
            // Create a new chatGPT message
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
                content: 'Given contents of a code file, return the revised code that adheres to the guide. Make changes only when necessary. Respond with only code, no natural language.'
            };
            // Create a new chatGPT request
            const chatGPTRequest = {
                model: 'gpt-4-32k',
                messages: [instructionMessage, chatGPTMessage, chatGPTMessage2],
            };
            // Send the chatGPT request
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
            // Replace the text in the editor with the new text
            editor.edit(editBuilder => {
                const range = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
                editBuilder.replace(range, newText);
            });
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map