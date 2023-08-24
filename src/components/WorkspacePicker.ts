import * as os from "os";
import * as Path from "path";
import * as vscode from "vscode";
import { FileType, Uri, QuickPickItem, QuickPick, } from "vscode";
import { Analyzer } from "./Analyzer";


/**
 * Provides a picker, appearing on top of the screen.
 * Asks the user to pick a workspace among opened workspaces for running coverage analysis.
 */
export class WorkspaceFolderItem implements QuickPickItem {
  label: string;
  workspaceFolder: vscode.WorkspaceFolder;
  description?: string;
  // detail?: string;
  // picked?: boolean;
  // alwaysShow?: boolean;
  
  constructor(wf: vscode.WorkspaceFolder, workspaceName: string | undefined) {
    this.workspaceFolder = wf;
    this.label = wf.name;
    this.description = `in ${workspaceName || 'unnamed workspace'}`
  }

  static async getCurrentWorkspaceFolderItems(): Promise<WorkspaceFolderItem[]> {
    if(!vscode.workspace.workspaceFolders) return []
    const workspaces = vscode.workspace.workspaceFolders?.map((wf: vscode.WorkspaceFolder) => new WorkspaceFolderItem(wf, vscode.workspace.name))
    return workspaces
  }
}


export class WorkspacePicker {
  private picker: QuickPick<WorkspaceFolderItem>;
  selected: WorkspaceFolderItem | undefined;

  constructor() {
    this.picker = this.initPicker();
  }

  initPicker(): QuickPick<WorkspaceFolderItem> {
    const picker: QuickPick<WorkspaceFolderItem> = vscode.window.createQuickPick();
    picker.placeholder = "Select workspace folder you want to measure coverage for:"
    picker.onDidChangeValue(this.onDidChangeValue.bind(this));
    picker.onDidAccept(this.onDidAccept.bind(this));
    picker.onDidHide(this.onDidHide.bind(this));
    return picker;
  }
  
  async pick() {
    this.picker.enabled = false;
    this.show();

    this.picker.items = await WorkspaceFolderItem.getCurrentWorkspaceFolderItems();

    this.picker.enabled = true;
  }

  getSelectedWorkspace(): vscode.WorkspaceFolder | undefined {
    return this.selected?.workspaceFolder;
  }

  
  show() {
    this.picker.show();
  }

  dispose() {
    this.picker.dispose();
  }

  onDidChangeValue(value: string) {
    // this.selected = this.picker.items.find((v: WorkspaceFolderItem) => v.label === value)
  }

  async onDidAccept() {
    this.selected = this.picker.selectedItems[0];
    const analyzer = Analyzer.getInstance()
    this.dispose()
    await analyzer.updateSelectedWorkspace(this.selected.workspaceFolder)
  }

  onDidHide() {
    this.dispose();
  }
}


