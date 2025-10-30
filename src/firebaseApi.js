import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  addDoc,
  updateDoc,
} from 'firebase/firestore';

export const fetchScenarios = async () => {
  const scenariosCollection = collection(db, 'scenarios');
  const querySnapshot = await getDocs(scenariosCollection);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || doc.id,
      // <<< [추가] description 필드 로드 (없으면 빈 문자열) ---
      description: data.description || '',
      // --- [추가 끝] >>>
      ...data, // job 등 다른 필드도 포함
    };
  });
};

// <<< [수정] description 파라미터 추가 ---
export const createScenario = async ({ newScenarioName, job, description }) => {
// --- [수정 끝] >>>
  const newScenarioRef = doc(db, 'scenarios', newScenarioName);
  const docSnap = await getDoc(newScenarioRef);
  if (docSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }
  // <<< [수정] description 필드 저장 ---
  await setDoc(newScenarioRef, { name: newScenarioName, job, description, nodes: [], edges: [], startNodeId: null });
  return { id: newScenarioName, name: newScenarioName, job, description, nodes: [], edges: [], startNodeId: null };
  // --- [수정 끝] >>>
};

// <<< [수정] description 파라미터 추가 ---
export const renameScenario = async ({ oldScenario, newName, job, description }) => {
// --- [수정 끝] >>>
    const oldDocRef = doc(db, 'scenarios', oldScenario.id);

    if (oldScenario.name !== newName) {
      const newDocRef = doc(db, 'scenarios', newName);
      const newDocSnap = await getDoc(newDocRef);
      if (newDocSnap.exists()) {
        throw new Error('A scenario with that name already exists.');
      }

      const oldDocSnap = await getDoc(oldDocRef);
      if (oldDocSnap.exists()) {
        const batch = writeBatch(db);
        // <<< [수정] 새 데이터에 description 포함 ---
        const newData = { ...oldDocSnap.data(), name: newName, job, description };
        // --- [수정 끝] >>>
        batch.set(newDocRef, newData);
        batch.delete(oldDocRef);
        await batch.commit();
      } else {
        throw new Error('Original scenario not found.');
      }
    } else {
      // <<< [수정] 이름 변경 없을 시 job과 description 업데이트 ---
      await updateDoc(oldDocRef, { job, description });
      // --- [수정 끝] >>>
    }
};

export const deleteScenario = async ({ scenarioId }) => {
  const docRef = doc(db, 'scenarios', scenarioId);
  await deleteDoc(docRef);
};

export const cloneScenario = async ({ scenarioToClone, newName }) => {
  const originalDocRef = doc(db, 'scenarios', scenarioToClone.id);
  const newDocRef = doc(db, 'scenarios', newName);

  const newDocSnap = await getDoc(newDocRef);
  if (newDocSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }

  const originalDocSnap = await getDoc(originalDocRef);
  if (!originalDocSnap.exists()) {
    throw new Error('The scenario to clone does not exist.');
  }

  const originalData = originalDocSnap.data();
  // <<< [수정] 복제 시 description 포함 ---
  const newData = {
    ...originalData,
    name: newName,
    job: scenarioToClone.job, // 원본의 job 정보 유지 (명시적으로 전달받는 것이 더 안전할 수 있음)
    description: originalData.description || '', // 원본 description 복사
    // startNodeId는 originalData에 포함되어 있음
  };
  // --- [수정 끝] >>>

  await setDoc(newDocRef, newData);
  return { id: newName, ...newData };
};


export const fetchScenarioData = async ({ scenarioId }) => {
  if (!scenarioId) return { nodes: [], edges: [], startNodeId: null, description: '' }; // description 기본값 추가
  const scenarioDocRef = doc(db, "scenarios", scenarioId);
  const docSnap = await getDoc(scenarioDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    // <<< [수정] description 로드 추가 ---
    return { ...data, startNodeId: data.startNodeId || null, description: data.description || '' };
    // --- [수정 끝] >>>
  }
  console.log(`No such document for scenario: ${scenarioId}!`);
  return { nodes: [], edges: [], startNodeId: null, description: '' }; // description 기본값 추가
};

export const saveScenarioData = async ({ scenario, data }) => {
  if (!scenario || !scenario.id) {
    throw new Error('No scenario selected to save.');
  }
  const scenarioDocRef = doc(db, "scenarios", scenario.id);
  // <<< [수정] 저장 데이터에 description 포함 (만약 scenario 객체에 최신 description이 없다면 data에서 가져오도록 수정 필요) ---
  // data 객체에 nodes, edges, startNodeId가 포함됨
  // 현재 구조상 scenario 객체의 description이 최신일 것으로 가정
  const saveData = {
    ...data, // nodes, edges, startNodeId
    name: scenario.name,
    job: scenario.job,
    description: scenario.description || '' // 시나리오 객체의 description 사용
  };
  await setDoc(scenarioDocRef, saveData, { merge: true }); // merge: true로 불필요한 필드 덮어쓰기 방지
  // --- [수정 끝] >>>
};

// ... (API/Form 템플릿 함수들은 변경 없음) ...
export const fetchApiTemplates = async () => {
  const templatesCollection = collection(db, 'apiTemplates');
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveApiTemplate = async (templateData) => {
  const templatesCollection = collection(db, 'apiTemplates');
  const docRef = await addDoc(templatesCollection, templateData);
  return { id: docRef.id, ...templateData };
};

export const deleteApiTemplate = async (templateId) => {
  const templateDocRef = doc(db, 'apiTemplates', templateId);
  await deleteDoc(templateDocRef);
};

export const fetchFormTemplates = async () => {
  const templatesCollection = collection(db, 'formTemplates');
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveFormTemplate = async (templateData) => {
  const templatesCollection = collection(db, 'formTemplates');
  const docRef = await addDoc(templatesCollection, templateData);
  return { id: docRef.id, ...templateData };
};

export const deleteFormTemplate = async (templateId) => {
  const templateDocRef = doc(db, 'formTemplates', templateId);
  await deleteDoc(templateDocRef);
};