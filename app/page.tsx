import Replay from './Replay';
import { assetUrl } from './site';

export default function Home() {
  return <>
    <header className="nav"><a className="wordmark" href="#">N-TacVLA<span className="dot" /></a><nav aria-label="Main navigation"><a href="#overview">Overview</a><a href="#replay">Replay</a><a href="#team">Author & Affiliations</a></nav><span className="nav-note">RESEARCH PROJECT · 2026</span></header>
    <main>
      <section className="hero wrap">
        <div className="eyebrow"><span className="dot" /> VISUAL · TACTILE · PROXIMITY</div>
        <h1>N-<span>Tac</span>VLA</h1>
        <div className="hero-intro"><h2>Vision and touch,<br />in real interaction.</h2><div><p>Explore G1 teleoperation through stereo and wrist video, tactile feedback, and proximity sensing.</p><a className="button" href="#replay">Explore the replay <span>↗</span></a></div></div>
        <div className="hero-camera"><img src={assetUrl('media/stereo.jpg')} alt="G1 stereo head camera recording of the workspace and both hands" /><div className="camera-top"><span>G1 / EGOCENTRIC VIEW</span><span>RECORDED DEMONSTRATION</span></div><div className="camera-bottom"><span>Two views. One interaction.</span><span>HEAD STEREO / L + R</span></div></div>
        <div className="author-line" id="team"><span className="author">Yu Sun</span><a href="https://www.dmrobot.com/en/">Daimon Robotics</a><a href="https://www.gbu.edu.cn/">Great Bay University</a><a href="https://en.hitsz.edu.cn/index.htm">Harbin Institute of Technology, Shenzhen</a></div>
      </section>
      <section className="section wrap overview" id="overview"><div className="section-label">01 / THE PROJECT</div><div><h2>Motion and contact,<br />on one timeline.</h2><p className="lead">N-TacVLA presents multimodal recordings from G1 teleoperation. Stereo head cameras, wrist cameras, tactile sensors, and proximity sensors capture complementary views of bimanual interaction.</p><div className="facts"><div><strong>G1</strong><span>Humanoid platform</span></div><div><strong>Bimanual</strong><span>Dexterous interaction</span></div><div><strong>Sensing</strong><span>Video, touch & proximity</span></div></div></div></section>
      <section className="section wrap" id="replay"><div className="section-label">02 / EXPLORE THE RECORDING</div><div className="replay-intro"><h2>Replay the motion.<br />Inspect the contact.</h2><p className="lead">Play a recording or scrub the timeline to compare camera views with tactile and proximity readings from both hands.</p></div><Replay/></section>
      <section className="section wrap" id="system"><div className="section-label">03 / THE COLLECTION SYSTEM</div><h2>From human motion<br />to multimodal recordings.</h2><div className="pipeline"><article><span>01 / INPUT</span><h3>Teleoperation</h3><p>HTC tracks body motion; Wuji gloves provide input for both hands.</p></article><article><span>02 / INTERACTION</span><h3>G1 & dexterous hands</h3><p>SONIC provides whole-body control with Inspire G2 hands.</p></article><article><span>03 / OBSERVATION</span><h3>Vision & touch</h3><p>Stereo head video, wrist video, tactile sensing, and proximity sensing.</p></article><article><span>04 / REPLAY</span><h3>Timeline replay</h3><p>Review motion and contact alongside the original outcome and data quality labels.</p></article></div></section>
    </main><footer className="wrap"><a className="wordmark" href="#">N-TacVLA<span className="dot" /></a><span>Yu Sun · 2026</span><a href="#">Back to top ↑</a></footer>
  </>;
}
