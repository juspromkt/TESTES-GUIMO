import bpc from './bpc.json';
import trabalhista from './trabalhista.json';
import auxilio from './auxilio.json';
import bancario from './bancario.json';
import invalidez from './invalidez.json';
import maternidade from './maternidade.json';
import descontoIndevido from './descontoIndevido.json';
import bancarioProdutorRural from './Bancário - Produtor Rural.json';
import pensaoDivorcio from './Pensão e Divórcio.json';
import pensaoMorte from './Pensão por Morte.json';

export const agentModels = {
  'bpc': {
    name: 'BPC/Loas',
    description: '',
    data: bpc
  },
  'trabalhista': {
    name: 'Trabalhista reclamante',
    description: '',
    data: trabalhista
  },
  'auxilio': {
    name: 'Auxilio Acidente',
    description: '',
    data: auxilio
  },
  'bancario': {
    name: 'Bancário - Superendividamento',
    description: '',
    data: bancario
  },
  'descontoIndevido': {
    name: 'Bancário RMC-RCC-Desconto Indevido - Consignado ',
    description: '',
    data: descontoIndevido
  },
  'invalidez': {
    name: 'Revisional de Aposentadoria por invalidez',
    description: '',
    data: invalidez
  },
  'maternidade': {
    name: 'Salário Maternidade',
    description: '',
    data: maternidade
  },
  'bancarioProdutorRural': {
    name: 'Bancário - Produtor Rural',
    description: '',
    data: bancarioProdutorRural
  },
  'pensaoDivorcio': {
    name: 'Pensão e Divórcio',
    description: '',
    data: pensaoDivorcio
  },
  'pensaoMorte': {
    name: 'Pensão por Morte',
    description: '',
    data: pensaoMorte
  }
};