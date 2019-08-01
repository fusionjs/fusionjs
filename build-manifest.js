// Reads the rush.json file and builds a corresponding manifest.json for jazelle
// CAN DELETE ONCE MIGRATION IS COMPLETE

const fs = require('fs');

const manifestStructure = {projects: []};

const rushJson = fs.readFileSync('./rush.json').toString('utf-8');
const evaled = eval('(' + rushJson + ')');
const projects = evaled.projects;

for (let i = 0; i < projects.length; i++) {
  manifestStructure.projects = manifestStructure.projects.concat(projects[i].projectFolder);
}

fs.writeFileSync('./manifest.json', JSON.stringify(manifestStructure, null, 2), 'utf8');
