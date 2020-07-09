// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/hajkmap/Hajk

import React from 'react';
import { Component } from 'react';

var defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  exportUrl: '/mapservice/export/pdf',
  exportTiffUrl: '/mapservice/export/tiff',
  pdfActive: true,
  tiffActive: true,
  base64Encode: false,
  autoScale: false,
  instruction: '',
  scales: [
    250,
    500,
    1000,
    2500,
    5000,
    10000,
    25000,
    50000,
    100000,
    250000
  ],
  resolutions: [72, 96, 150, 200, 300],
  allowedResolutions: [72, 96, 150, 200, 300],
  paperFormats: ["A2", "A3", "A4"],
  allowedPaperFormats:  ["A2", "A3", "A4"], // Paper formats supported
  proxyUrl: '',
  visibleForGroups: []
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor () {
    super();
    this.state = defaultState;
    this.type = 'export';
  }

  componentDidMount () {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        exportUrl: tool.options.exportUrl,
        exportTiffUrl: tool.options.exportTiffUrl,
        tiffActive: tool.options.tiffActive,
        pdfActive: tool.options.pdfActive,
        base64Encode: tool.options.base64Encode,
        autoScale: tool.options.autoScale,
        proxyUrl: tool.options.proxyUrl,
        instruction: tool.options.instruction,
        visibleForGroups: tool.options.visibleForGroups ? tool.options.visibleForGroups : [],
        resolutions: tool.options.resolutions ? tool.options.resolutions.sort((a, b) => a - b) : [],
        paperFormats: tool.options.paperFormats ? tool.options.paperFormats.sort() : []
      });
    } else {
      this.setState({
        active: false
      });
    }
  }

  componentWillUnmount () {
  }
  /**
   *
   */
  componentWillMount () {
  }

  handleInputChange (event) {
    var target = event.target;
    var name = target.name;
    var value = target.type === 'checkbox' ? target.checked : target.value;
    if (typeof value === 'string' && value.trim() !== '') {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }

    if (name == 'instruction') {
      value = btoa(value);
    }
    this.setState({
      [name]: value
    });
  }

  getTool () {
    return this.props.model.get('toolConfig').find(tool => tool.type === this.type);
  }

  add (tool) {
    this.props.model.get('toolConfig').push(tool);
  }

  remove (tool) {
    this.props.model.set({
      'toolConfig': this.props.model.get('toolConfig').filter(tool => tool.type !== this.type)
    });
  }

  replace (tool) {
    this.props.model.get('toolConfig').forEach(t => {
      if (t.type === this.type) {
        t.options = tool.options;
        t.index = tool.index;
        t.instruction = tool.instruction;
      }
    });
  }

  save () {
    var tool = {
      'type': this.type,
      'index': this.state.index,
      'options': {
        exportUrl: this.state.exportUrl,
        exportTiffUrl: this.state.exportTiffUrl,
        pdfActive: this.state.pdfActive,
        tiffActive: this.state.tiffActive,
        base64Encode: this.state.base64Encode,
        autoScale: this.state.autoScale,
        scales: this.state.scales,
        resolutions: this.state.resolutions,
        paperFormats: this.state.paperFormats,
        proxyUrl: this.state.proxyUrl,
        instruction: this.state.instruction,
        visibleForGroups: this.state.visibleForGroups.map(Function.prototype.call, String.prototype.trim)

      }
    };

    var existing = this.getTool();

    function update () {
      this.props.model.updateToolConfig(this.props.model.get('toolConfig'), () => {
        this.props.parent.props.parent.setState({
          alert: true,
          alertMessage: 'Uppdateringen lyckades'
        });
      });
    }

    if (!this.state.active) {
      if (existing) {
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage: 'Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?',
          confirmAction: () => {
            this.remove();
            update.call(this);
            this.setState(defaultState);
          }
        });
      } else {
        this.remove();
        update.call(this);
      }
    } else {
      if (existing) {
        this.replace(tool);
      } else {
        this.add(tool);
      }
      update.call(this);
    }
  }

  handleAuthGrpsChange (event) {
    const target = event.target;
    const value = target.value;
    let groups = [];

    try {
      groups = value.split(',');
    } catch (error) {
      console.log(`Någonting gick fel: ${error}`);
    }

    this.setState({
      visibleForGroups: value !== '' ? groups : []
    });
  }

  renderVisibleForGroups () {
    if (this.props.parent.props.parent.state.authActive) {
      return (
        <div>
          <label htmlFor='visibleForGroups'>Tillträde</label>
          <input id='visibleForGroups' value={this.state.visibleForGroups} type='text' name='visibleForGroups' onChange={(e) => { this.handleAuthGrpsChange(e); }} />
        </div>
      );
    } else {
      return null;
    }
  }

  addpaperFormat (e) {
    var elements = this.refs.paperFormatForm.elements;
    if(!this.state.allowedPaperFormats.includes(elements['paperFormat'].value)){
      alert("Angivet format stöds ej. Följande format stöds " + this.state.allowedPaperFormats.join(", "));
      return;
    }

    if(this.state.paperFormats.includes(elements['paperFormat'].value)){
      alert("Angivet format är redan tillagt");
      return;
    }

    this.state.paperFormats.push(elements['paperFormat'].value);
    this.state.paperFormats.sort();
    this.setState({
      paperFormats: this.state.paperFormats
    });
  }

  removepaperFormat (paperFormat) {
    this.state.paperFormats = this.state.paperFormats.filter(f => f !== paperFormat);
    this.setState({
      paperFormats: this.state.paperFormats
    });
  }

  renderpaperFormat () {

    return this.state.paperFormats.map((t, i) => (
        <div key={i} className='inset-form'>
          <div>
            <span onClick={() => this.removepaperFormat(t)} className='btn btn-danger'>Ta bort</span>
          </div>
          <div><span>Pappersformat </span>: <span>{t}</span></div>
        </div>
    ));
  }

  addresolutions (e) {
    var elements = this.refs.resolutionsForm.elements;
    var res = parseInt(elements['resolutions'].value);
    if(!this.state.allowedResolutions.includes(res)){
      alert("Angivet upplösning stöds ej. Följande upplösningar stöds " + this.state.allowedResolutions.join(", "));
      return;
    }

    if(this.state.resolutions.includes(res)){
      alert("Angiven upplösning är redan tillagt");
      return;
    }

    this.state.resolutions.push(res);
    console.log(this.state.resolutions);
    this.state.resolutions.sort((a, b) => a - b);
    this.setState({
      resolutions: this.state.resolutions
    });
  }

  removeresolutions (res) {
    res = parseInt(res);
    this.state.resolutions = this.state.resolutions.filter(f => f !== res);
    this.setState({
      resolutions: this.state.resolutions
    });
  }

  renderresolutions () {

    return this.state.resolutions.map((t, i) => (
        <div key={i} className='inset-form'>
          <div>
            <span onClick={() => this.removeresolutions(t)} className='btn btn-danger'>Ta bort</span>
          </div>
          <div><span>Upplösning </span>: <span>{t}</span></div>
        </div>
    ));
  }


  /**
   *
   */
  render () {
    return (
      <div>
        <form>
          <p>
            <button className='btn btn-primary' onClick={(e) => { e.preventDefault(); this.save(); }}>Spara</button>
          </p>
          <div>
            <input
              id='active'
              name='active'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.active} />&nbsp;
            <label htmlFor='active'>Aktiverad</label>
          </div>
          <div>
            <label htmlFor='index'>Sorteringsordning</label>
            <input
              id='index'
              name='index'
              type='text'
              onChange={(e) => { this.handleInputChange(e); }}
              value={this.state.index} />
          </div>
          <div>
            <label htmlFor='exportUrl'>URL till PDF-tjänst</label>
            <input value={this.state.exportUrl} type='text' name='exportUrl' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
          <div>
            <label htmlFor='exportTiffUrl'>URL till TIFF-tjänst</label>
            <input value={this.state.exportTiffUrl} type='text' name='exportTiffUrl' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
          <div>
            <input
              id='pdf-active'
              name='pdfActive'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.pdfActive} />&nbsp;
            <label htmlFor='pdf-active'>PDF aktiverad</label>
          </div>
          <div>
            <input
              id='tiff-active'
              name='tiffActive'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.tiffActive} />&nbsp;
            <label htmlFor='tiff-active'>TIFF aktiverad</label>
          </div>
          <div>
            <input
              id='Base64-active'
              name='base64Encode'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.base64Encode} />&nbsp;
            <label htmlFor='Base64-active'>Base64-encoding aktiverad</label>
          </div>
          <div>
            <input
              id='autoScale-active'
              name='autoScale'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.autoScale} />&nbsp;
            <label htmlFor='autoScale-active'>autoScale av previewLayer för mobil aktiverad</label>
          </div>
          <div>
            <div>paperFormat</div>
            {this.renderpaperFormat()}
          </div>
          <div>
            <form ref='paperFormatForm' onSubmit={(e) => { e.preventDefault(); this.addpaperFormat(e); }}>
              <div>
                <label>Pappersformat</label><input name='paperFormat' type='text' /><br/>
                <label>Tillåtna format: {this.state.allowedPaperFormats.join(", ")}</label>
              </div>
              <button className='btn btn-success'>Lägg till</button>
            </form>
          </div>
          <div>
            <div>Resolutions</div>
            {this.renderresolutions()}
          </div>
          <div>
            <form ref='resolutionsForm' onSubmit={(e) => { e.preventDefault(); this.addresolutions(e); }}>
              <div>
                <label>Resolutions</label><input name='resolutions' type='text' /><br/>
                <label>Tillåtna format: {this.state.allowedResolutions.join(", ")}</label>
              </div>
              <button className='btn btn-success'>Lägg till</button>
            </form>
          </div>
          <div>
            <label htmlFor='instruction'>Instruktion</label>
            <textarea
              type='text'
              id='instruction'
              name='instruction'
              onChange={(e) => { this.handleInputChange(e); }}
              value={this.state.instruction ? atob(this.state.instruction) : ''}
            />
          </div>
          {this.renderVisibleForGroups()}
          <div>
            <label htmlFor='proxyUrl'>Proxy URL till utskrift och export</label>
            <input value={this.state.proxyUrl} type='text' name='proxyUrl' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
        </form>
      </div>
    );
  }
}

export default ToolOptions;