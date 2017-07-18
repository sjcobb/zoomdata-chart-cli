import * as inquirer from 'inquirer';
import { Variables, Visualization } from '../../../../@types/zoomdata';
import { Config } from '../../../../commands/config';
import { visualizations } from '../../../../requests';
import ora = require('ora');

const options = [
  {
    name: 'ATTRIBUTE & TIME',
    value: ['ATTRIBUTE', 'TIME'],
  },
  {
    name: 'TIME',
    value: ['TIME'],
  },
];

const questions: inquirer.Question[] = [
  {
    choices: options,
    message: 'Select the field types allowed when configuring this variable:',
    name: 'attributeType',
    type: 'list',
  },
  {
    default: false,
    message: 'Will this variable drive color in your chart?:',
    name: 'colorFlag',
    type: 'confirm',
  },
];

function answerHandler(
  answers: inquirer.Answers,
  varOpts: Variables.Core,
  visualization: Visualization,
  serverConfig: Config,
) {
  let groupType: 'attribute' | 'time';
  /*tslint:disable:prefer-conditional-expression */
  if (
    answers.attributeType.indexOf('ATTRIBUTE') >= 0 &&
    answers.attributeType.indexOf('TIME') >= 0
  ) {
    groupType = 'attribute';
  } else if (
    answers.attributeType.length === 1 &&
    answers.attributeType.indexOf('TIME') === 0
  ) {
    groupType = 'time';
  } else {
    groupType = 'attribute';
  }
  /*tslint:enable:prefer-conditional-expression */
  const variableDef: Variables.Group = {
    ...varOpts,
    ...{
      attributeType: answers.attributeType,
      groupType,
      type: 'group',
      visualizationId: visualization.id,
    },
  };

  if (answers.colorFlag) {
    const config: Variables.GroupConfigBase = {
      autoShowColorLegend: false,
      colorGroupIndex: 0,
      groupColorSet: 'ZoomPalette',
    };
    Object.assign(variableDef, { config });
  }

  visualization.variables.push(variableDef);

  const spinner = ora(
    `Adding variable ${varOpts.name} to: ${visualization.name}`,
  ).start();
  return visualizations
    .update(visualization.id, JSON.stringify(visualization), serverConfig)
    .then(() => spinner.succeed())
    .catch(error => {
      spinner.fail();
      return Promise.reject(error);
    });
}

function prompt(
  varOpts: Variables.Core,
  visualization: Visualization,
  serverConfig: Config,
) {
  return inquirer
    .prompt(questions)
    .then(answers =>
      answerHandler(answers, varOpts, visualization, serverConfig),
    );
}

export { prompt };
