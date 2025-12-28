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
    name: 'Unitree H1',
    url: 'https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/h1_description/urdf/h1.urdf',
    type: 'urdf'
  },
  {
    name: 'Boston Dynamics Spot',
    url: 'https://raw.githubusercontent.com/bdaiinstitute/spot_ros2/main/spot_description/urdf/spot.urdf',
    type: 'urdf'
  },
  {
    name: 'Fetch Robot',
    url: 'https://raw.githubusercontent.com/fetchrobotics/fetch_ros/melodic-devel/fetch_description/robots/fetch.urdf',
    type: 'urdf'
  },
  {
    name: 'UR5 Arm',
    url: 'https://raw.githubusercontent.com/ros-industrial/universal_robot/melodic-devel/ur_description/urdf/ur5.urdf',
    type: 'urdf'
  }
];

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
    name: 'G1 Dance 1',
    url: 'https://huggingface.co/datasets/lvhaidong/LAFAN1_Retargeting_Dataset/resolve/main/g1/dance1_subject1.csv',
    robotType: 'G1'
  }
];
