import 'hxblock-blocks/python_compressed';

import ScratchBlocks from 'hxblock-blocks';
import log from './log';

// Key under project meta where the platform-facing Python snapshot lives
// (73 FUN-001C). The kids-code-platform backend reads it from project_json
// to render a read-only "code" tab on project detail and share pages.
const SNAPSHOT_META_KEY = 'kidsCodePython';

/**
 * Attach a Python code snapshot to a serialized VM state string before it
 * is stored to the platform (FUN-001C).
 *
 * The snapshot is written into `meta` next to the regular sb3 metadata, so
 * no platform schema change is needed. The VM serializer rebuilds `meta`
 * from scratch on every save, which keeps the snapshot honest: it never
 * survives a save that could not regenerate it.
 *
 * Pure stage projects (no device selected) are skipped on purpose: the
 * Python generator does not cover stage/looks/motion blocks and a
 * fragmentary listing would mislead parents (see FUN-001C task card).
 *
 * @param {string} vmState JSON string produced by vm.toJSON().
 * @return {string} vmState with the snapshot attached, or the original
 *     string when the project is not a hardware project or generation
 *     fails for any reason (saving must never break because of this).
 */
const attachPythonSnapshot = function (vmState) {
    try {
        const project = JSON.parse(vmState);
        if (!project || !project.device) return vmState;
        const workspace = typeof ScratchBlocks.getMainWorkspace === 'function' ?
            ScratchBlocks.getMainWorkspace() : null;
        if (!workspace) return vmState;
        // Same generator calls as the FUN-001B live preview, so the saved
        // snapshot always matches what the child saw in the editor.
        const code = ScratchBlocks.Python.workspaceToCode(workspace);
        if (typeof code !== 'string' || code.trim() === '') return vmState;
        const coverage = ScratchBlocks.Python.getCoverage(workspace);
        project.meta = project.meta || {};
        project.meta[SNAPSHOT_META_KEY] = {
            code: code,
            unsupportedTotal: (coverage && coverage.unsupportedTotal) || 0,
            generatedAt: new Date().toISOString()
        };
        return JSON.stringify(project);
    } catch (e) {
        log.warn('Could not attach Python snapshot, saving without it', e);
        return vmState;
    }
};

export {
    attachPythonSnapshot,
    SNAPSHOT_META_KEY
};
