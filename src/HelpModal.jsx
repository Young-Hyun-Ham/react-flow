import styles from './HelpModal.module.css';

// Component converted from manual content to JSX
const HelpManual = () => (
  <>
    <h2>1. Getting Started</h2>
    <h3>1.1. Login</h3>
    <ul>
      <li>You must log in with a Google account to use the service.</li>
      <li>Only users with <strong>authorized emails and domains</strong>(<code>cyberlogitec.com</code>, <code>wisenut.co.kr</code>) can access the service.</li>
    </ul>
    <h3>1.2. Main Screen</h3>
    <ul>
      <li><strong>Flow Editor</strong>: The main workspace for visually creating and editing chatbot conversation flows.</li>
      <li><strong>Board</strong>: Provides a simple bulletin board feature to help communication between users.</li>
    </ul>

    <h2>2. Scenario Management</h2>
    <p>The first screen you see after login is the <strong>Scenario List</strong>.</p>
    <ul>
      <li><strong>Add New Scenario</strong>: Click the <code>+ Add New Scenario</code> button and enter a scenario name to create a new conversation flow.</li>
      <li><strong>Select Scenario</strong>: Click on a scenario name in the list to navigate to that scenario's editing screen.</li>
      <li><strong>Edit/Delete Scenario</strong>: Use the <code>Edit</code> button next to each scenario item to change the name, or the <code>Delete</code> button to permanently remove the scenario.</li>
    </ul>

    <h2>3. Flow Editor Screen Layout</h2>
    <ol>
      <li><strong>Node Addition Panel (Left)</strong>: Add various types of nodes that make up the scenario to the canvas.</li>
      <li><strong>Canvas (Center)</strong>: Space for placing nodes and connecting them to create actual conversation flows.</li>
      <li><strong>Controller Panel (Right)</strong>: Activated when you select a node on the canvas, allowing you to edit the detailed content of that node.</li>
      <li><strong>Simulator (Right)</strong>: Can be activated by clicking the <code>🤖</code> icon to test how your written scenario works in real-time as an actual chatbot.</li>
    </ol>

    <h2>4. Node Types and Functions</h2>
    <p>Click the desired node from the left panel to add it to the canvas.</p>
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Node Type</th>
          <th>Icon Color</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Message</strong></td>
          <td>Orange</td>
          <td>The most basic text message that the chatbot sends to users. You can add quick reply buttons (Quick Replies).</td>
        </tr>
        <tr>
          <td><strong>Form</strong></td>
          <td>Purple</td>
          <td>A form for receiving structured data input from users. (e.g., name, date, checkboxes, etc.)</td>
        </tr>
        <tr>
          <td><strong>Condition Branch</strong></td>
          <td>Green</td>
          <td>Divides the conversation flow into multiple branches based on user responses.</td>
        </tr>
        <tr>
          <td><strong>API</strong></td>
          <td>Blue</td>
          <td>Used to receive user input and store it in specific variables (Slots), or when integration with external systems is needed.</td>
        </tr>
        <tr>
          <td><strong>Fixed Menu</strong></td>
          <td>Red</td>
          <td>Configures a menu that is always exposed at the bottom of the chatbot conversation window. Can be the starting point of a scenario.</td>
        </tr>
        <tr>
          <td><strong>Link</strong></td>
          <td>Navy</td>
          <td>Delivers external website links to users.</td>
        </tr>
      </tbody>
    </table>

    <h2>5. Scenario Editing and Testing</h2>
    <h3>5.1. Node Editing</h3>
    <ol>
      <li>Click on the node you want to edit on the canvas.</li>
      <li>Modify the node's text, buttons, form elements, etc. in the <strong>Controller Panel</strong> that appears on the right.</li>
      <li>When editing is complete, click the <code>Save Changes</code> button at the bottom of the controller panel to apply changes to the node.</li>
    </ol>

    <h3>5.2. Node Connection</h3>
    <ul>
      <li>Click on the connection points (Handles) on the right or left edges of nodes and drag to other nodes' connection points to connect conversation flows.</li>
      <li><strong>Condition Branch/Fixed Menu nodes</strong>: Each button (Branch/Menu) has its own separate connection point.</li>
    </ul>

    <h3>5.3. Node and Connection Deletion/Duplication</h3>
    <ul>
      <li><strong>Delete Node</strong>: Click the <code>❌</code> button in the top right of the node.</li>
      <li><strong>Delete Connection</strong>: Click only the connection you want to delete on the canvas to select it, then press <code>Backspace</code> or <code>Delete</code> on your keyboard.</li>
      <li><strong>Duplicate Node</strong>: Click the <code>+ Duplicate Node</code> button that appears at the bottom of the left 'Add Node' panel when you select the node you want to duplicate.</li>
    </ul>

    <h3>5.4. Save and Test</h3>
    <ul>
      <li><strong>Save</strong>: Click the <code>Save Scenario</code> button in the top right of the screen to save the current scenario you're working on to the server.</li>
      <li><strong>Test</strong>: Click the <code>🤖</code> icon to open the simulator and test whether the scenario works as intended.</li>
    </ul>
  </>
);


function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <h1>Chatbot Scenario Editor User Manual</h1>
        <HelpManual />
      </div>
    </div>
  );
}

export default HelpModal;
