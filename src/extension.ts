import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.sendCode', () => {
      sendCodeToServer();
    })
  );
}

async function sendCodeToServer() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor!');
    return;
  }

  const code = editor.document.getText();
  const serverUrl = 'https://yourserver.url/your-endpoint';

  try {
    const response = await axios.post(serverUrl, { code });
    vscode.window.showInformationMessage('Code sent successfully!');
  } catch (error) {
    vscode.window.showErrorMessage('Failed to send code!');
  }
}

export function deactivate() {}