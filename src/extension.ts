// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let panel: vscode.WebviewPanel | undefined = undefined;
let editor: vscode.TextEditor | undefined = undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	context.subscriptions.push(vscode.commands.registerCommand('avr-runner.runCode', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		editor = vscode.window.activeTextEditor;

		if (editor) {
			const filePath = editor.document.uri.fsPath;
			const fileExtension = path.extname(filePath);

			// Check if the file extension is .asm
			if (fileExtension === '.asm' || fileExtension === '.avr') {
				// Logic to run the .asm file (you can replace this with your actual run logic)
				if (panel) {
                    panel.reveal(vscode.ViewColumn.Beside);
                } else {
					panel = vscode.window.createWebviewPanel(
						'avr-runner-webview', // Identifies the type of the WebView
						'AVR Runner WebView',     // Title of the WebView
						vscode.ViewColumn.Beside, // Where the WebView will be displayed (e.g., editor column)
						{
							enableScripts: true,  // Enable JavaScript in the WebView
							localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))] // Allow the WebView to access local files
						}
					);

					panel.onDidDispose(() => {
                        panel = undefined;
                    }, null, context.subscriptions);

					panel.onDidChangeViewState((e) => {
						if (e.webviewPanel.visible) {
							if (panel && editor) {
								// When the file is saved, update the WebView content
								const fileContent = editor.document.getText();
								if (fileContent) {
									panel.webview.postMessage({
										command: 'updateContent',
										content: fileContent
									});
								}
							}
						}
					})
				}
		

				// Path to the HTML file
				const htmlPath = path.join(context.extensionPath, 'media', 'index.html');

				// Read the HTML file content
				fs.readFile(htmlPath, 'utf8', (err, htmlContent) => {
					if (err) {
						vscode.window.showErrorMessage('Failed to read HTML file');
						return;
					}

					// Resolve paths for the CSS and JS files
					if(panel && editor) {
						const cssUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'style.css')));
						const jsUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'simulator.js')));

						// Inject the correct URIs into the HTML content
						htmlContent = htmlContent.replace('style.css', cssUri.toString());
						htmlContent = htmlContent.replace('simulator.js', jsUri.toString());

						const fileContent = editor.document.getText();
						htmlContent = htmlContent.replace(
							'<textarea class="text-code" id="code_box" name="code_box" rows="5" cols="60" wrap="off" spellcheck="false"></textarea>',
							`<textarea class="text-code" id="code_box" name="code_box" rows="5" cols="60" wrap="off" spellcheck="false">${fileContent}</textarea>` // Inject file content
						);

						// Set the WebView content by injecting the HTML file content directly
						panel.webview.html = htmlContent;
					}
					
				});

			} else {
				vscode.window.showInformationMessage("This file is not a .asm or a .avr file.");
			}
		}


	}));

		
	vscode.workspace.onDidSaveTextDocument(async (d) => {
        if (panel && editor) {
			if (editor.document == d) {
				// When the file is saved, update the WebView content
				const fileContent = editor.document.getText();
				if (fileContent) {
					panel.webview.postMessage({
						command: 'updateContent',
						content: fileContent
					});
				}
			}
		}
    }, null, context.subscriptions);

}

// This method is called when your extension is deactivated
export function deactivate() { }
