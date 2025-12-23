export const SAMPLE_MODELS = [
  {
    name: 'Unitree G1',
    url: 'https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/g1_description/urdf/g1.urdf',
    type: 'urdf'
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
    name: 'G1 Walk Forward',
    url: 'https://example.com/motions/g1_walk_forward.csv',
    robotType: 'G1'
  },
  {
    name: 'H1 Stand Up',
    url: 'https://example.com/motions/h1_stand_up.csv',
    robotType: 'H1'
  }
];
