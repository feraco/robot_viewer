export const SAMPLE_MODELS = [
  {
    name: 'Unitree G1 (29 DOF)',
    url: './g1/g1_29dof.xml',
    type: 'xml'
  },
  {
    name: 'Unitree G1 (23 DOF)',
    url: './g1/g1_23dof.xml',
    type: 'xml'
  },
  {
    name: 'Simple Car',
    url: './car/car.xml',
    type: 'xml'
  }
];

const HF_BASE_URL = 'https://huggingface.co/datasets/lvhaidong/LAFAN1_Retargeting_Dataset/resolve/main/g1';

export const SAMPLE_MOTIONS = [
  {
    name: 'G1 Stand',
    url: './g1_stand.csv',
    robotType: 'G1'
  },
  {
    name: 'G1 Walk Forward',
    url: './g1_walk_forward.csv',
    robotType: 'G1'
  },
  {
    name: 'G1 Walk Backward',
    url: './g1_walk_backward.csv',
    robotType: 'G1'
  },
  {
    name: 'G1 Sidestep Left',
    url: './g1_sidestep_left.csv',
    robotType: 'G1'
  },
  {
    name: 'G1 Sidestep Right',
    url: './g1_sidestep_right.csv',
    robotType: 'G1'
  },
  {
    name: 'G1 Turn Left',
    url: './g1_turn_left.csv',
    robotType: 'G1'
  },
  {
    name: 'G1 Turn Right',
    url: './g1_turn_right.csv',
    robotType: 'G1'
  },
  {
    name: 'Dance 1 - Subject 1',
    url: `${HF_BASE_URL}/dance1_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Dance 1 - Subject 2',
    url: `${HF_BASE_URL}/dance1_subject2.csv`,
    robotType: 'G1'
  },
  {
    name: 'Dance 1 - Subject 3',
    url: `${HF_BASE_URL}/dance1_subject3.csv`,
    robotType: 'G1'
  },
  {
    name: 'Dance 2 - Subject 1',
    url: `${HF_BASE_URL}/dance2_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Dance 2 - Subject 2',
    url: `${HF_BASE_URL}/dance2_subject2.csv`,
    robotType: 'G1'
  },
  {
    name: 'Dance 2 - Subject 3',
    url: `${HF_BASE_URL}/dance2_subject3.csv`,
    robotType: 'G1'
  },
  {
    name: 'Dance 2 - Subject 4',
    url: `${HF_BASE_URL}/dance2_subject4.csv`,
    robotType: 'G1'
  },
  {
    name: 'Dance 2 - Subject 5',
    url: `${HF_BASE_URL}/dance2_subject5.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fall and Get Up 1 - Subject 1',
    url: `${HF_BASE_URL}/fallAndGetUp1_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fall and Get Up 1 - Subject 4',
    url: `${HF_BASE_URL}/fallAndGetUp1_subject4.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fall and Get Up 1 - Subject 5',
    url: `${HF_BASE_URL}/fallAndGetUp1_subject5.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fall and Get Up 2 - Subject 2',
    url: `${HF_BASE_URL}/fallAndGetUp2_subject2.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fall and Get Up 2 - Subject 3',
    url: `${HF_BASE_URL}/fallAndGetUp2_subject3.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fall and Get Up 3 - Subject 1',
    url: `${HF_BASE_URL}/fallAndGetUp3_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fight 1 - Subject 2',
    url: `${HF_BASE_URL}/fight1_subject2.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fight 1 - Subject 3',
    url: `${HF_BASE_URL}/fight1_subject3.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fight 1 - Subject 5',
    url: `${HF_BASE_URL}/fight1_subject5.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fight and Sports 1 - Subject 1',
    url: `${HF_BASE_URL}/fightAndSports1_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Fight and Sports 1 - Subject 4',
    url: `${HF_BASE_URL}/fightAndSports1_subject4.csv`,
    robotType: 'G1'
  },
  {
    name: 'Jumps 1 - Subject 1',
    url: `${HF_BASE_URL}/jumps1_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Jumps 1 - Subject 2',
    url: `${HF_BASE_URL}/jumps1_subject2.csv`,
    robotType: 'G1'
  },
  {
    name: 'Jumps 1 - Subject 5',
    url: `${HF_BASE_URL}/jumps1_subject5.csv`,
    robotType: 'G1'
  },
  {
    name: 'Run 1 - Subject 2',
    url: `${HF_BASE_URL}/run1_subject2.csv`,
    robotType: 'G1'
  },
  {
    name: 'Run 1 - Subject 5',
    url: `${HF_BASE_URL}/run1_subject5.csv`,
    robotType: 'G1'
  },
  {
    name: 'Run 2 - Subject 1',
    url: `${HF_BASE_URL}/run2_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Run 2 - Subject 4',
    url: `${HF_BASE_URL}/run2_subject4.csv`,
    robotType: 'G1'
  },
  {
    name: 'Sprint 1 - Subject 2',
    url: `${HF_BASE_URL}/sprint1_subject2.csv`,
    robotType: 'G1'
  },
  {
    name: 'Sprint 1 - Subject 4',
    url: `${HF_BASE_URL}/sprint1_subject4.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 1 - Subject 1',
    url: `${HF_BASE_URL}/walk1_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 1 - Subject 2',
    url: `${HF_BASE_URL}/walk1_subject2.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 1 - Subject 5',
    url: `${HF_BASE_URL}/walk1_subject5.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 2 - Subject 1',
    url: `${HF_BASE_URL}/walk2_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 2 - Subject 3',
    url: `${HF_BASE_URL}/walk2_subject3.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 2 - Subject 4',
    url: `${HF_BASE_URL}/walk2_subject4.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 3 - Subject 1',
    url: `${HF_BASE_URL}/walk3_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 3 - Subject 2',
    url: `${HF_BASE_URL}/walk3_subject2.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 3 - Subject 3',
    url: `${HF_BASE_URL}/walk3_subject3.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 3 - Subject 4',
    url: `${HF_BASE_URL}/walk3_subject4.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 3 - Subject 5',
    url: `${HF_BASE_URL}/walk3_subject5.csv`,
    robotType: 'G1'
  },
  {
    name: 'Walk 4 - Subject 1',
    url: `${HF_BASE_URL}/walk4_subject1.csv`,
    robotType: 'G1'
  },
  {
    name: 'Car Forward',
    url: './car_forward.csv',
    robotType: 'Car'
  },
  {
    name: 'Car Backward',
    url: './car_backward.csv',
    robotType: 'Car'
  },
  {
    name: 'Car Turn Left',
    url: './car_turn_left.csv',
    robotType: 'Car'
  },
  {
    name: 'Car Turn Right',
    url: './car_turn_right.csv',
    robotType: 'Car'
  }
];
