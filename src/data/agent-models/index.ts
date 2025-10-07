import bpc from './bpc.json';
import trabalhista from './trabalhista.json';
import auxilio from './auxilio.json';
import bancario from './bancario.json';
import invalidez from './invalidez.json';
import maternidade from './maternidade.json';
import descontoIndevido from './descontoIndevido.json';

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
  }
};