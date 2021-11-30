const { 
  getSessionFromStorage,
  Session,
} = require("@inrupt/solid-client-authn-node");

const {
    //isRawData,
    isContainer,
    deleteContainer,
    createContainerAt,
    overwriteFile,
    getSourceUrl,
    getContentType,
    deleteFile,
    getFile,        
    access,
    //DATASET
    getSolidDataset,
    createSolidDataset, 
    saveSolidDatasetAt,
    //ACP
    acp_v3
} = require("@inrupt/solid-client");

const fs = require('fs');
const { readFile, writeFile } = require('fs/promises');

/*
##############################################################################
----------------------------------LOGIN FUNCTIONS-------------------------------
################################################################################
*/
function createSessionID(){

  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var result = date+'-'+time+'-'+Math.random().toString(36).substr(2, 9);

  return result;
};


async function logging(sessionID, token){

    sessionID += createSessionID();

    const session = new Session(
      {
        //clientAuthentication: getClientAuthenticationWithDependencies({})
        //public readonly info: ISessionInfo,
        //storage: IStorage;  //set-delete-get
        //tokenRequestInProgress = false,
        //onNewRefreshToken?: (newToken: string) => unknown
        onNewRefreshToken: (newToken) => { 
          console.log("New refresh token: ", newToken);
          //token = newToken;
        }
        //defaultMaxListeners: number,
        //errorMonitor: typeof errorMonitor,
      },
      sessionID
    );

    await session.login({
      // Set oidcIssuer to the Solid Identity Provider associated with the credentials.
      oidcIssuer: token.provider,

      //An already-registered clientId, which identifies your application to the Solid Identity Provider.
      clientId: token.clientId,

      //An already-registered clientSecret, associated to the Client ID. Like a password
      clientSecret: token.clientSecret,

      //An already-registered refreshToken, which your application can use to get an Access Token.
      //Access Tokens allows you to access Resources for which you have been authorized.
      refreshToken: token.refreshToken,
      
      onNewRefreshToken: (newToken) => { 
        console.log("New refresh token: ", newToken);
        //token = newToken;
      }
    })
    .then(() => {
      if (session.info.isLoggedIn) {
        console.log("I m logged in :", session.info.isLoggedIn);
        /**
        * The WebID of the app, or a "Public app" WebID if the app does not provide its own.
        * undefined until the session is logged in and the app WebID has been verified.
        */
        //console.log("clientAppId: ",session.info.clientAppId);
        //The WebID if the user is logged into the session, and undefined if not
        console.log("WebID: ",session.info.webId);
        /**
          * UNIX timestamp (number of milliseconds since Jan 1st 1970) representing the
          * time until which this session is valid.
          */
        console.log("Expiration Date: ",session.info.expirationDate);          
      }
      else
        console.log("You are not logged");   
    }); 
    
    return session;

}


function logOut(session){
  session.logout();
  console.log("Logged out");
}


async function getSession(sessionID){ 
  try {
    //const session = await getSessionFromStorage(sessionID);
    const session = getSessionFromStorage(sessionID);
    return session;    
  } catch (error) {
    console.log("getSession");
    console.log(error);
  }   
}

/*
##############################################################################
----------------------------------ACL FUNCTIONS-------------------------------
################################################################################
*/
async function getPermissions(resourceUrl, agentOrGroupID, session){

  try{

    var resourceAccess = await access.getAgentAccess(resourceUrl, agentOrGroupID, { fetch:session.fetch });    

    if (resourceAccess == null){
      console.log("You may not have the permission to view the access to the given Resource,\
        or it might be setted by an external function.");
      return false;
    } 
    else {
      console.log("The resource can be accessed by agent with: ");
      console.log("Returned Access:: ", JSON.stringify(resourceAccess));
      console.log("", (resourceAccess.read ? 'CAN' : 'CANNOT'), "read");
      console.log("", (resourceAccess.append ? 'CAN' : 'CANNOT'), "add data");
      console.log("", (resourceAccess.write ? 'CAN' : 'CANNOT'), "change data");
      console.log("", (resourceAccess.controlRead ? 'CAN' : 'CANNOT'), "see access");
      console.log("", (resourceAccess.controlWrite ? 'CAN' : 'CANNOT'), "change access");
      
      console.log("Note: the access is attached only to the resource. (Not applied to Container)");
    
      return resourceAccess;
    }

  } catch (error) {
    console.log("getPermissions");
    console.log(error);
  }
}     //potrebbe essere necessario definire una Promise come return


async function getPublicPermissions(resourceUrl, session){

  try{

    var mySolidDatasetWithAcl = await getSolidDatasetWithAcl(resourceUrl, { fetch : session.fetch});

    //var publicAccess = getPublicAccess(resourceUrl);  // se questa, rimuovi fetch dalla funzione
    var publicAccess = getPublicAccess(mySolidDatasetWithAcl);

    if (publicAccess == null){
      console.log("You may not have the permission to view the access to the given Resource,\
        or it might be setted by an external function.");
      return false;
    } 
    else {
      console.log("The resource has PUBLIC access with: ");
      console.log("Returned Access:: ", JSON.stringify(publicAccess));
      console.log("", (publicAccess.read ? 'CAN' : 'CANNOT'), "read");
      console.log("", (publicAccess.append ? 'CAN' : 'CANNOT'), "add data");
      console.log("", (publicAccess.write ? 'CAN' : 'CANNOT'), "change data");
      console.log("", (publicAccess.controlRead ? 'CAN' : 'CANNOT'), "see access");
      console.log("", (publicAccess.controlWrite ? 'CAN' : 'CANNOT'), "change access");
      
      console.log("Note: the access is attached only to the resource. (Not applied to Container)");
    
      return publicAccess;
    }

  } catch (error) {
    console.log(error);
  }
}


//### About SET ACCESS
async function setAccess(resourceUrl, agentOrGroupID, accessSet, session){

  try {

    var resourceAccessSet = await access.setAgentAccess(resourceUrl, agentOrGroupID, accessSet, { fetch : session.fetch });
    //console.log(resourceAccessSet);

    if (resourceAccessSet == null){
      console.log("You may not have the permission to set any access to the given Resource, \
      or it might be setted by an external function.");
      return false;
    }
    else {
      console.log("", accessSet, " access is applied to the Resource");
      console.log("Note: the access is attached only to the resource. (Not applied to Container)");

      return true; 
    }
  } catch (error) {
    console.log("setAccess");
    console.log(error);
  }
}


async function setAccessPublic(resourceUrl, accessSet, session){

  try {
    var resourceAccessSet = await access.setPublicAccess(resourceUrl, accessSet, { fetch : session.fetch });

    if (resourceAccessSet == null){
      console.log("You may not have the permission to set any PUBLIC access to the given Resource, \
      or it might be setted by an external function.");
      return false;
    }
    else {
      console.log("Public ", accessSet, " access is applied to the Resource");

      console.log("Note: the access is attached only to the resource. (Not applied to Container)");

      return true; 
    }
  } catch (error) {
    console.log("setAccessPublic");
    console.log(error);
  }
}

/*
##############################################################################
----------------------------------ACP FUNCTIONS-------------------------------
################################################################################
*/
async function createDatasetACP(resourceURL, session){
  try {
    let myRulesDataset = createSolidDataset();

    if(isDataset(resourceURL)){
      const savedSolidDataset = await saveSolidDatasetAt(
        resourceURL,
        myRulesDataset,
        { fetch: session.fetch }
      );
      
      console.log("Rules Dataset created succesfully");
    }
    else
      console.log("The resource is not a Dataset");
  } catch (error) {
    console.log("createDatasetACP");
    console.log(error);
  }
}


async function createAgentRuleACP(resourceUrl, agentOrGroupID, who, resourceName, session){

  try {

    var myRulesDataset = await getDataset(resourceUrl, session);

    // 2. Initialize your new Rules.
    let rule = acp_v3.createRule(`${resourceUrl}#${who}-rule-${resourceName}`);
  
    // 3. For the rules, specify the Agent to match.
    rule = acp_v3.addAgent(rule, agentOrGroupID);

    // 4. Add your new rules to the SolidDataset.
    myRulesDataset = acp_v3.setRule(myRulesDataset, rule);

    const savedSolidDataset = await saveSolidDatasetAt(
      resourceUrl,
      myRulesDataset,
      { fetch: session.fetch }       // fetch from the authenticated session
    );

  } catch (error) {
    console.log("createAgentRuleACP");
    console.log(error);
  }
}


async function createPolicyACP(resourceUrl, accessModes, who, resourceName, session) {
  try {
    
    var myRulesDataset = await getDataset(resourceUrl, session);
 
    let policy = acp_v3.createPolicy(`${resourceUrl}#${who}-policy-${resourceName}`);

    policy = acp_v3.addAllOfRuleUrl(
      policy,
      `${resourceUrl}#${who}-rule-${resourceName}`
    );

    policy = acp_v3.setAllowModes(
      policy,
      accessModes,
    );

    myRulesDataset = acp_v3.setPolicy(myRulesDataset, policy);

    const savedSolidDataset = await saveSolidDatasetAt(
      resourceUrl,
      myRulesDataset,
      { fetch: session.fetch }      // fetch from the authenticated session
    );
  } catch (error) {
    console.log("createPolicyACP");
    console.log(error);
  }
}


async function createMemberRulesPolicies(resourceUrl, acpUrl, who, resourceName, session) {
  try {

    const resourceWithAcr = await acp_v3.getSolidDatasetWithAcr(
      resourceUrl,  //Container
      { fetch: session.fetch }            // fetch from the authenticated session
     );
     
    // Add the newly created policy as a Member Policy for the Container
    let changedResourceWithAcr = acp_v3.addMemberAcrPolicyUrl(
    resourceWithAcr,
    `${acpUrl}#${who}-policy-${resourceName}`
    );

    changedResourceWithAcr = acp_v3.addMemberPolicyUrl(
      changedResourceWithAcr,
      `${acpUrl}#${who}-policy-${resourceName}`
    );

    changedResourceWithAcr = acp_v3.addPolicyUrl(
      changedResourceWithAcr,
      `${acpUrl}#${who}-policy-${resourceName}`
    );

    changedResourceWithAcr = acp_v3.addAcrPolicyUrl(
      changedResourceWithAcr,
      `${acpUrl}#${who}-policy-${resourceName}`
    );

    console.log(`acr : ${resourceName}`, acp_v3.acrAsMarkdown(changedResourceWithAcr));

    // 8. Save the Resource with its ACR.
    const updatedResourceWithAcr = await acp_v3.saveAcrFor(
      changedResourceWithAcr, 
      { fetch: session.fetch }          // fetch from the authenticated session
    );

  } catch (error) {
    console.log("createMemberRulesPolicies");
    console.log(error);
  }
}

/*
##############################################################################
----------------------------------ACP RESOURCE FUNCTIONS-------------------------------
################################################################################
*/
async function createResourceSpecificRulesPolicies(resourceUrl, title, accessModes, agentOrGroupID, session) {
  try {

    // 1. Fetch the SolidDataset with its Access Control Resource (ACR).
    let resourceWithAcr = await acp_v3.getFileWithAcr(
        resourceUrl,
        { fetch: session.fetch }          // fetch from the authenticated session
    );

    // 2. Create the Resource-specific Rule.
    let resourceRule = acp_v3.createResourceRuleFor(resourceWithAcr, title+"-rule");
    resourceRule = acp_v3.setAgent(resourceRule, agentOrGroupID);   

    // 3. Create the Resource-specific Policy.
    let resourcePolicy = acp_v3.createResourcePolicyFor(
      resourceWithAcr,
      title+"-policy",
    );

    resourcePolicy = acp_v3.addAllOfRuleUrl(
      resourcePolicy,
      resourceRule
    );
    
    // 5. Specify the access modes for the policy.
    resourcePolicy = acp_v3.setAllowModes(
      resourcePolicy,
      accessModes,
    );

    // 6. Add the new Rule to the Access Control Resource.
    resourceWithAcr = acp_v3.setResourceRule(
      resourceWithAcr,
      resourceRule,
    );

    // 7. Add the new Policy to the Access Control Resource.
    resourceWithAcr = acp_v3.setResourcePolicy(
      resourceWithAcr,
      resourcePolicy,
    );

    // 8. Save the Resource with its ACR.
    const updatedResourceWithAcr = await acp_v3.saveAcrFor(
      resourceWithAcr, 
      { fetch: session.fetch }          // fetch from the authenticated session
    );

  } catch (error) {
    console.log("createResourceSpecificRulesPolicies");
    console.log(error);
  }
}


async function createResourceSpecificPublicRulesPolicies(resourceUrl, title, accessModes, session) {
  try {

    // 1. Fetch the SolidDataset with its Access Control Resource (ACR).
    let resourceWithAcr = await acp_v3.getFileWithAcr(
        resourceUrl,
        { fetch: session.fetch }          // fetch from the authenticated session
    );

    // 2. Create the Resource-specific Rule.
    let resourceRule = acp_v3.createResourceRuleFor(resourceWithAcr, title+"-public-rule");
    resourceRule = acp_v3.setPublic(resourceRule);    

    // 3. Create the Resource-specific Policy.
    let resourcePolicy = acp_v3.createResourcePolicyFor(
      resourceWithAcr,
      title+"-public-policy",
    );

    resourcePolicy = acp_v3.addAllOfRuleUrl(
      resourcePolicy,
      resourceRule
    );
    
    // 5. Specify the access modes for the policy.
    resourcePolicy = acp_v3.setAllowModes(
      resourcePolicy,
      accessModes,
    );

    // 6. Add the new Rule to the Access Control Resource.
    resourceWithAcr = acp_v3.setResourceRule(
      resourceWithAcr,
      resourceRule,
    );

    // 7. Add the new Policy to the Access Control Resource.
    resourceWithAcr = acp_v3.setResourcePolicy(
      resourceWithAcr,
      resourcePolicy,
    );

    // 8. Save the Resource with its ACR.
    const updatedResourceWithAcr = await acp_v3.saveAcrFor(
      resourceWithAcr, 
      { fetch: session.fetch }          // fetch from the authenticated session
    );

  } catch (error) {
    console.log("createResourceSpecificRulesPolicies");
    console.log(error);
  }
}

/*
##############################################################################
----------------------------------RESOURCE-BASED FUNCTIONS-------------------------------
################################################################################
*/
//--------------------------------  FILE DATA ---------------------------------------
function isFile(resourceURL){

  const pathArray = resourceURL.split("/");
  const lastIndex = pathArray.length - 1;
  const lastArray = pathArray[lastIndex].split(".");
  if (lastArray.constructor.name=="Array" && lastArray.length-1 == 1){
    return true;
  }
  
  return false;  
}


async function uploadFileFromPath(filepath, mimetype, targetURL, fileName, session) {
  try {

    var data = await readFile(filepath);

    //var fileName = filepath.replace(/^.*[\\\/]/, '');

    /**
     * to write a file without container (pre-existence) constraints
     * Users with Write access to the given folder/Container may prefer to use overwriteFile.
     * overwriteFile<FileExt>(fileUrl, file, options?): Promise<FileExt & WithResourceInfo>;
     */
    // If the targetFileURL exists, overwrite the file.
    const savedFile = await overwriteFile(
      targetURL + fileName , //"https://pod.example.com/some/container/myFile.txt",
      data, //new Blob(["This is a plain piece of text"], { type: "plain/text" }),
      { contentType: mimetype, fetch: session.fetch } //optional?, mimetype:"text/plain"
    );
    
    console.log(`File saved at ${getSourceUrl(savedFile)}`);
  } catch (err) {
    console.log("uploadFileFromPath");
    console.log(err);
  }
}


async function uploadJSON(data, url, fileName, session) {
  try {

    await writeFile('./utils/temp.json', data, 'utf8');

    await uploadFileFromPath('./utils/temp.json', "application/json", url, fileName, session);

    // //delete the temp file
    // fs.unlinkSync('./utils/temp.json', (err) => {
    //   if (err) {
    //     throw err;
    //   }
    //   console.log("Temp File is deleted.");
    // });

    // /**
    //  * to write a file without container (pre-existence) constraints
    //  * Users with Write access to the given folder/Container may prefer to use overwriteFile.
    //  * overwriteFile<FileExt>(fileUrl, file, options?): Promise<FileExt & WithResourceInfo>;
    //  */
    // // If the targetFileURL exists, overwrite the file.
    // const savedFile = await overwriteFile(
    //   url , //"https://pod.example.com/some/container/myFile.txt",
    //   data, //new Blob(["This is a plain piece of text"], { type: "plain/text" }),
    //   { contentType: mimetype, fetch: session.fetch } 
    // );

    // //console.log("savedFile");
    // //console.log(savedFile);
    
    // console.log(`File saved at ${getSourceUrl(savedFile)}`);
  } catch (err) {
    console.log("uploadJSON");
    console.log(err);
  }
}

    
async function readFileFromPod(resourceURL, session) {
  try {
    if (isFile(resourceURL)){
      const file = await getFile(
        resourceURL,               // File in Pod to Read
        { fetch: session.fetch }       // fetch from authenticated session
      );

      console.log(`Fetched a ${getContentType(file)} file from ${getSourceUrl(file)}.`);
      //console.log(`The file is ${isRawData(file) ? "not " : ""}a dataset.`);

      const json = JSON.parse(await file.text());

      // const arrayBuffer = await file.arrayBuffer();
      // await writeFile('./utils/temp.json', new Uint8Array(arrayBuffer));
      // var json = await readFile('./utils/temp.json', 'utf8');
      // json = JSON.parse(json);

      return json;
    }
    else {
      console.log("The URL passed as argument seems to not be a file.")
      console.log("Try to pass a file as URL.")
    }
  } catch (err) {
    console.log(err);
  }
}

async function readPublicFileFromPod(resourceURL) {
  try {
    if (isFile(resourceURL)){
      const file = await getFile(
        resourceURL               // File in Pod to Read
      );

      console.log(`Fetched a ${getContentType(file)} file from ${getSourceUrl(file)}.`);
      //console.log(`The file is ${isRawData(file) ? "not " : ""}a dataset.`);

      const json = JSON.parse(await file.text());

      // const arrayBuffer = await file.arrayBuffer();
      // await writeFile('./utils/temp.json', new Uint8Array(arrayBuffer));
      // var json = await readFile('./utils/temp.json', 'utf8');
      // json = JSON.parse(json);

      return json;
    }
    else {
      console.log("The URL passed as argument seems to not be a file.")
      console.log("Try to pass a file as URL.")
    }
  } catch (err) {
    console.log(err);
  }
}


async function deleteFileFromPod(resourceURL, session) {
  try {
    if (isFile(resourceURL)){
       await deleteFile(
        resourceURL,          // File to delete from Pod
        { fetch: session.fetch }   // fetch from the authenticated session
      );
      console.log(`File deleted at/from ${resourceURL}`);
    }
    else {
      console.log("The URL passed as argument seems to not be a file.")
      console.log("Try to pass a file as URL.")
    }
  } catch (error) {
    console.error(error);
  }
}
	

//--------------------------------  STRUCTURED DATA ---------------------------------------
function isDataset(resourceURL){

  const pathArray = resourceURL.split("/");
  const lastIndex = pathArray.length - 1;
  const lastArray = pathArray[lastIndex].split(".");
  if (lastArray.constructor.name=="Array" && lastArray.length-1 == 0 && lastArray[0] != ""){
    //console.log("is a Dataset");
    //console.log(pathArray[lastIndex]);
    return true;
  }
  return false;  
}


async function getDataset(resourceURL, session){
  try {
    if(isDataset(resourceURL)){
      let myDataset = await getSolidDataset(
        resourceURL,
        { fetch: session.fetch }          // fetch from the authenticated session
      );
      return myDataset;
    }
    else 
        console.log("The resource is not a Dataset");
  } catch (error) {
    console.log("getDataset");
    console.log(error);
  }
}


async function createContainer(resourceURL, session){
  try {
    await createContainerAt(resourceURL, { fetch : session.fetch});
    //console.log(createAcl(resourceURL));
    console.log("Container created succesfully");
  } catch (error) {
    //Throws an error if creating the Container failed, 
    //e.g. because the current user does not have permissions to, 
    //or because the Container already exists.
    console.log("createContainer");
    console.log(error);
  }
}


//If operating on a container, the container must be empty otherwise a 409 CONFLICT will be raised.
async function deleteContainerFromPod(resourceURL, session) {
  try {
    if (isContainer(resourceURL)){
      /*
      var resources = getAllResources(resourceURL);
      if (resources != null){
        console.log("Container is not empty, so i'm going to remove all its content.");
        for(let i = 0; i <resources.length; i++){
            deleteFileFromPod(resources[i], session);
        }        
      }
      */
      await deleteContainer(resourceURL, { fetch : session.fetch });
      console.log(`Container deleted at/from ${resourceURL}`);
    }
    else {
      console.log("The URL passed as argument seems to not be a Container.")
      console.log("Try to pass a Solid Container as URL.")
    }
  } catch (error) {
    console.log("deleteContainerFromPod");
    console.log(error);
  }
}
      

module.exports = { 
  logging,
  logOut,
  getSession, 
  getPermissions,
  getPublicPermissions,
  setAccess, 
  setAccessPublic, 
  uploadFileFromPath,
  uploadJSON,
  readFileFromPod,
  deleteFileFromPod,
  createContainer,
  deleteContainerFromPod,
  //ACP-Resources
  createDatasetACP,
  createAgentRuleACP,
  createPolicyACP,
  createMemberRulesPolicies,
  createResourceSpecificRulesPolicies,
  createResourceSpecificPublicRulesPolicies,
  readPublicFileFromPod,
  //getPermissionsACP,
  //getContainerAcr,
}