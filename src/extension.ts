import {
    OpenAIApi,
    Configuration,
    CreateChatCompletionRequest,
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageRoleEnum
} from 'openai';

import * as fs from 'fs';
import * as path from 'path';

class ChatGPTClient {
    private openAI: OpenAIApi;
    constructor() {
        const configuration = new Configuration({
            apiKey: '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',
        });
        this.openAI = new OpenAIApi(configuration);
    }
    async respond(chatGPTMessages: Array<ChatCompletionRequestMessage>) {
        try {
            if (!chatGPTMessages) {
                return {
                    text: 'No chatGPT Messages',
                };
            }
            const request: CreateChatCompletionRequest = {
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
        } catch (error) {
            console.log(error);
            throw new Error(String(error));
        }
    }
}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension is now active!');

    let disposable = vscode.commands.registerCommand('bunyan.generate', async () => {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            const originalUri = document.uri;
            const text = document.getText();
            
            // read text from style.txt
            let styleText: string;
            try {
                styleText = fs.readFileSync(path.resolve(__dirname, 'style.spec'), 'utf8');
            } catch (error) {
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

                const chatGPTMessage: ChatCompletionRequestMessage = {
                    role: 'user',
                    content: text,
                };

                const instructionMessage: ChatCompletionRequestMessage = {
                    role: 'assistant',
                    content: 'Make changes only when necessary. Respond with only code, no natural language.'
                };

                const chatGPTMessage2: ChatCompletionRequestMessage = {
                    role: 'user',
                    content: `Given contents of a code and the style guide file, return the revised code following style guide: ${styleText}. Only code response`
                };

                const chatGPTRequest: CreateChatCompletionRequest = {
                    model: 'gpt-4-32k',
                    messages: [instructionMessage, chatGPTMessage, chatGPTMessage2],
                };

                progress.report({ increment: 25 });

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

                progress.report({ increment: 50 });

                // editor.edit(editBuilder => {
                //     const range = new vscode.Range(
                //         document.positionAt(0),
                //         document.positionAt(text.length)
                //     );
                //     editBuilder.replace(range, newText);
                // });

                // Create a new text document
                const newDocument = await vscode.workspace.openTextDocument({ content: newText });

                // Show the diff view
                vscode.commands.executeCommand('vscode.diff', document.uri, newDocument.uri, 'Original vs. Modified');

                progress.report({ increment: 75 });

                // Show information message with two options
                const result = await vscode.window.showInformationMessage('Do you want to apply these changes to the original file?', 'Yes', 'No');

                // If the user selects 'Yes', update the original document
                // If the user selects 'Yes', update the original document
                if (result === 'Yes') {
                    const originalDocument = await vscode.workspace.openTextDocument(originalUri); // Open the original document
                    const originalEditor = await vscode.window.showTextDocument(originalDocument); // Show the original document

                    // Apply the changes to the original document
                    await originalEditor.edit(editBuilder => {
                        const range = new vscode.Range(
                            originalDocument.positionAt(0),
                            originalDocument.positionAt(text.length)
                        );
                        editBuilder.replace(range, newText);
                    });
                }
                progress.report({ increment: 100 });
            });
        }
    });
}
